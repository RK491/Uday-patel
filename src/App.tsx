import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Package,
  Sparkles,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import firebaseConfig from '../firebase-applet-config.json';
import { testFirestoreConnection } from './firebase';
import {
  activateCoopFever,
  activateFeedBooster,
  AD_NETWORK_TASKS,
  ADSGRAM_BOT_JOIN_TASK,
  applyAutoHarvestIfDue,
  applyLeftChannelPenalties,
  buildReferralBotNotificationMessage,
  buyChickens,
  calculatePendingEggs,
  calculateProductionRate,
  CHICKEN_PACKS,
  claimAchievement,
  claimAdNetworkReward,
  claimAdsgramBotJoinReward,
  claimDailyStreak,
  claimPromoCode,
  collectEggs,
  completeTask,
  COOP_FEVER_REQUIRED_ADS,
  createDefaultProfile,
  createDefaultSeasonConfig,
  createPaidTaskOrder,
  createRefundPaidTaskOrder,
  createTopUpPaidTaskOrder,
  DEFAULT_AD_CONFIG,
  DEFAULT_ADMINS_CONFIG,
  DEFAULT_CHANNELS_CONFIG,
  DEFAULT_ECONOMY_CONFIG,
  DEFAULT_GET_CODE_CHANNEL_URL,
  DEFAULT_GRAM_DEPOSIT_ADDRESS,
  DEFAULT_GRAM_JETTON_MASTER,
  DEFAULT_MAINTENANCE_CONFIG,
  DEFAULT_TASK_PRICING_CONFIG,
  DEFAULT_WITHDRAW_APPROVE_TEMPLATE,
  eggsToUsd,
  executeDeposit,
  executeWithdrawal,
  extractTelegramNumericUserId,
  formatAwayDuration,
  formatChannelsHandleSummary,
  formatGoldenEggCooldownWait,
  formatPromoRewardSummary,
  formatShortTonWallet,
  getActiveRequiredChannels,
  getActiveReinvestSurgeStatus,
  getCoopFeverProgress,
  getEffectiveAdminIds,
  getGoldenEggCooldownRemainingMs,
  getTaskChannelCheckMode,
  getUnifiedUserId,
  getVerifiableClaimedChannelTasks,
  getWithdrawAdGateStatus,
  isAdminPlayerId,
  isAutoHarvestDroneActive,
  isChannelVerificationSatisfied,
  isMustJoinChannelsEnabled,
  mergeTaskDefinitions,
  MIN_WITHDRAW_ADS_WATCHED,
  normalizeTelegramChannelHandle,
  purchaseAutoHarvestDrone,
  recordCompletedGateAd,
  recordCoopFeverAd,
  REFERRAL_DEPOSIT_COMMISSION_RATE,
  REFERRER_SIGNUP_BONUS_COINS,
  reinvestEggs,
  renderPayoutChannelApproveMessage,
  renderWithdrawApproveMessage,
  resolveEconomyConfig,
  resolveLiveTaskChannelLinks,
  resolveMaintenanceConfig,
  resolveTaskPricingConfig,
  shouldShowSignUpBonusClaim,
  SIGNUP_BONUS_COINS,
  type TaskChannelCheckMode,
  upgradeBasket,
  watchAdStep,
} from './game/economy';
import {
  getPrimaryDepositMemo,
  normalizeTxHash,
  type DetectedGramTransfer,
} from './game/tonGram';
import {
  addAdminInFirestore,
  adjustPlayerCoinsInFirestore,
  adjustPlayerReferralCountInFirestore,
  adjustPlayerWithdrawAdsInFirestore,
  adminAddReferralRelationInFirestore,
  adminRemoveReferralRelationInFirestore,
  applyReferralCodeInFirestore,
  banPlayerInFirestore,
  claimGoldenEggInFirestore,
  clearStoredGoldenEggClaimAtMs,
  commitPlayerMutation,
  createCustomTaskInFirestore,
  createPaidCustomTaskInFirestore,
  createPromoCodeInFirestore,
  deleteCustomTaskInFirestore,
  deletePromoCodeInFirestore,
  ensurePlayerInFirestore,
  executeDataResetInFirestore,
  fetchCustomTasksFromFirestore,
  fetchPlayerReferralsFromFirestore,
  getStoredGoldenEggClaimAtMs,
  getStoredPlayerId,
  incrementPromoCodeUseInFirestore,
  incrementTaskClaimCountInFirestore,
  loadCachedBanRecord,
  loadCachedPlayerProfile,
  refundPaidCustomTaskInFirestore,
  removeAdminInFirestore,
  resolveActivePlayerIdentity,
  reviewWithdrawalInFirestore,
  saveAdConfigInFirestore,
  saveCachedPlayerProfile,
  saveChannelsConfigInFirestore,
  saveEconomyConfigInFirestore,
  saveMaintenanceConfigInFirestore,
  saveTaskPricingConfigInFirestore,
  saveWithdrawApproveTemplateInFirestore,
  searchUsersInFirestore,
  setCachedLiveEconomyConfig,
  setStoredGoldenEggClaimAtMs,
  subscribeToAdConfig,
  subscribeToAdminsConfig,
  subscribeToAllWithdrawRequests,
  subscribeToBannedUsers,
  subscribeToChannelsConfig,
  subscribeToCustomTasks,
  subscribeToEconomyConfig,
  subscribeToLeaderboard,
  subscribeToMaintenanceConfig,
  subscribeToPlayer,
  subscribeToPlayerBanStatus,
  subscribeToPromoCodes,
  subscribeToRecentPlayers,
  subscribeToSeasonConfig,
  subscribeToSystemResetConfig,
  subscribeToTaskPricingConfig,
  subscribeToWithdrawApproveTemplate,
  toggleCustomTaskInFirestore,
  togglePromoCodeInFirestore,
  topUpPaidCustomTaskInFirestore,
  unbanPlayerInFirestore,
} from './services/farmStore';
import type {
  AdConfig,
  AdminsConfig,
  AdNetworkId,
  AutoHarvestCurrency,
  AutoHarvestDurationId,
  BannedUserRecord,
  ChannelCheckDiagnosticLog,
  ChannelsConfig,
  ChannelVerificationResult,
  ChickenBreedId,
  DepositOrder,
  DynamicPromoCode,
  EconomyConfig,
  LanguageCode,
  LeaderboardEntry,
  MaintenanceConfig,
  NavTab,
  PromoRewardType,
  ReferralRecord,
  RequiredTelegramChannel,
  SeasonConfig,
  SubView,
  SystemDiagnosticsSnapshot,
  SystemResetConfig,
  TaskCategory,
  TaskDefinition,
  TaskPricingConfig,
  TransactionEntry,
  UserFarmProfile,
  WithdrawApproveMessageTemplate,
  WithdrawalOrder,
  WithdrawRequestRecord,
} from './types/farm';
import {
  tryRunAdNetwork,
  tryRunAdsgramTaskAd,
  tryRunExternalRewardedAd,
} from './utils/ads';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getStoredLanguage, setStoredLanguage, t } from './utils/i18n';
import {
  calculateMsUntilBasketFull,
  dispatchBasketFullNotification,
  getBrowserNotificationPermission,
  getStoredLastNotifiedCycle,
  isDocumentBackgrounded,
  requestBrowserNotificationPermission,
  setStoredLastNotifiedCycle,
  shouldTriggerBasketFullNotification,
} from './utils/notifications';
import {
  triggerCollectConfetti,
  triggerDepositConfetti,
  triggerGoldenEggConfetti,
  triggerRewardConfetti,
  triggerWithdrawalConfetti,
} from './utils/celebration';
import {
  type AudioSettings,
  computeMuteAllToggle,
  getStoredAudioSettings,
  isAllAudioMuted,
  playChickenCluckSound,
  playClaimSound,
  playCoinChimeSound,
  playEggCollectSound,
  playGoldenEggSound,
  playPurchaseSuccessSound,
  playSoftTapSound,
  playTabTapSound,
  setStoredAudioSettings,
  stopAmbientMusic,
  syncAmbientMusic,
} from './utils/sound';
import {
  appendLocalChannelLog,
  cacheDetectedTelegramBotConfig,
  clearLocalAdminBotConfig,
  detectBrowserTelegramBotConfig,
  ensureTelegramWebAppReady,
  fetchApiWithFallback,
  getBrowserStartParam,
  getLocalAdminBotConfig,
  getTelegramChannelUrl,
  getTelegramInitData,
  hasTelegramRuntimeContext,
  loadLocalChannelLogs,
  parseStartAppAction,
  resolveApiUrl,
  safeFetchJson,
  setLocalAdminBotConfig,
  subscribeTelegramAppActivated,
  type TelegramBotConfig,
  triggerHapticFeedback,
  verifyTelegramBotTokenDirect,
} from './utils/telegram';
import { applyThemeToDocument, getStoredTheme, setStoredTheme, type ThemeMode } from './utils/theme';
import { AdminPanelView } from './components/AdminPanelView';
import { BottomNav } from './components/BottomNav';
import { ChannelCheckModal } from './components/ChannelCheckPanel';
import { DepositView } from './components/DepositView';
import { FarmMeadow } from './components/FarmMeadow';
import { FriendsView } from './components/FriendsView';
import { CoinIcon, EggIcon } from './components/GameIcons';
import { LeaderboardView } from './components/LeaderboardView';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { PacksView } from './components/PacksView';
import { ProfileView, SettingsModal, YourFarmView } from './components/ProfileAndFarmViews';
import { OfflineIndicator } from './components/PWAControls';
import { ReinvestModal } from './components/ReinvestModal';
import { type ModalAdActionKind, RewardedAdModal } from './components/RewardedAdModal';
import { SignUpBonusModal } from './components/SignUpBonusModal';
import { SplashScreen } from './components/SplashScreen';
import { TasksView } from './components/TasksView';
import { TopBar } from './components/TopBar';
import { WalletView } from './components/WalletView';
import { WelcomeBackModal } from './components/WelcomeBackModal';
import { WithdrawView } from './components/WithdrawView';

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatSyncErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error) || !err.message) return fallback;
  let raw = err.message.trim();
  let path = '';
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw) as { error?: unknown; path?: unknown };
      if (typeof parsed.error === 'string' && parsed.error.trim()) {
        raw = parsed.error.trim();
      }
      if (typeof parsed.path === 'string' && parsed.path.trim()) {
        path = parsed.path.trim();
      }
    } catch {
      // Keep original message
    }
  }
  const low = raw.toLowerCase();
  if (low.includes('missing or insufficient permissions') || low.includes('permission-denied')) {
    return path
      ? `Permission denied saving ${path} — deploy firestore.rules or check Admin ID.`
      : 'Permission denied by Firestore rules — deploy firestore.rules or check Admin ID.';
  }
  if (low.includes('client is offline') || low.includes('unavailable')) {
    return 'Network offline — check internet connection and retry.';
  }
  return raw || fallback;
}

export default function App() {
  const [detectedIdentity, setDetectedIdentity] = useState(() => resolveActivePlayerIdentity());
  const activePlayerId = detectedIdentity.playerId || getStoredPlayerId();
  const activePlayerIdRef = useRef<string>(activePlayerId);
  activePlayerIdRef.current = activePlayerId;
  const initialSeed = useMemo(() => {
    const cached = loadCachedPlayerProfile(activePlayerId);
    if (cached) {
      return {
        profile: { ...cached, language: cached.language || getStoredLanguage(activePlayerId) },
        transactions: [] as TransactionEntry[],
      };
    }
    const seed = createDefaultProfile(
      activePlayerId,
      detectedIdentity.displayName,
      detectedIdentity.handle,
      Date.now(),
      detectedIdentity.photoUrl,
    );
    seed.profile.language = getStoredLanguage(activePlayerId);
    return seed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [profile, setProfile] = useState<UserFarmProfile>(initialSeed.profile);
  const latestProfileRef = useRef<UserFarmProfile>(initialSeed.profile);
  const [depositAddress, setDepositAddress] = useState<string>(DEFAULT_GRAM_DEPOSIT_ADDRESS);
  const [gramJettonMaster, setGramJettonMaster] = useState<string>(DEFAULT_GRAM_JETTON_MASTER);
  const [payoutChannel, setPayoutChannel] = useState<string>('@AG_PAYOUTS');
  const [telegramBotConfig, setTelegramBotConfig] = useState<TelegramBotConfig>(() =>
    detectBrowserTelegramBotConfig(),
  );
  const [transactions, setTransactions] = useState<TransactionEntry[]>(initialSeed.transactions);
  const [referralTransactions, setReferralTransactions] = useState<TransactionEntry[]>([]);
  const [deposits, setDeposits] = useState<DepositOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalOrder[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [serverReferralIds, setServerReferralIds] = useState<string[]>([]);
  const [customTasks, setCustomTasks] = useState<TaskDefinition[]>([]);
  const [adConfig, setAdConfig] = useState<AdConfig>(DEFAULT_AD_CONFIG);
  const [channelsConfig, setChannelsConfig] = useState<ChannelsConfig>(DEFAULT_CHANNELS_CONFIG);
  const [allWithdrawRequests, setAllWithdrawRequests] = useState<WithdrawRequestRecord[]>([]);
  const [withdrawApproveTemplate, setWithdrawApproveTemplate] =
    useState<WithdrawApproveMessageTemplate>(DEFAULT_WITHDRAW_APPROVE_TEMPLATE);
  const [taskPricingConfig, setTaskPricingConfig] =
    useState<TaskPricingConfig>(DEFAULT_TASK_PRICING_CONFIG);
  const [economyConfig, setEconomyConfig] = useState<EconomyConfig>(DEFAULT_ECONOMY_CONFIG);
  const economyConfigRef = useRef<EconomyConfig>(DEFAULT_ECONOMY_CONFIG);
  economyConfigRef.current = economyConfig;
  const [systemResetConfig, setSystemResetConfig] = useState<SystemResetConfig>({
    resetEpochMs: 0,
    resetCount: 0,
    resetBy: '',
    updatedAtMs: 0,
  });
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig>(
    DEFAULT_MAINTENANCE_CONFIG,
  );
  const [maintenanceLoaded, setMaintenanceLoaded] = useState(false);
  const [promoCodes, setPromoCodes] = useState<DynamicPromoCode[]>([]);
  const [recentPlayers, setRecentPlayers] = useState<UserFarmProfile[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [seasonConfig, setSeasonConfig] = useState<SeasonConfig>(() => createDefaultSeasonConfig());
  const [bannedUsers, setBannedUsers] = useState<BannedUserRecord[]>([]);
  const [adminsConfig, setAdminsConfig] = useState<AdminsConfig>(DEFAULT_ADMINS_CONFIG);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminSessionToken, setAdminSessionToken] = useState<string>('');
  const adminSessionTokenRef = useRef<string>('');
  adminSessionTokenRef.current = adminSessionToken;
  const [playerSessionToken, setPlayerSessionToken] = useState<string>('');
  const playerSessionTokenRef = useRef<string>('');
  const [adminPasscodeSource, setAdminPasscodeSource] = useState<
    'database' | 'server_file' | 'env' | 'default' | 'unconfigured'
  >('env');
  const [adminPasscodeUpdatedAtMs, setAdminPasscodeUpdatedAtMs] = useState<number>(0);
  const [adminNeedsPasscodeSetup, setAdminNeedsPasscodeSetup] = useState<boolean>(false);
  const [serverBotConfigured, setServerBotConfigured] = useState<boolean | undefined>(undefined);
  const [botConfigStatus, setBotConfigStatus] = useState<{
    configured: boolean;
    source: 'runtime' | 'env' | 'local_preview' | 'none';
    maskedToken: string;
    botUsername: string | null;
    updatedAtMs: number;
  } | null>(null);
  const [channelDiagnosticLogs, setChannelDiagnosticLogs] = useState<ChannelCheckDiagnosticLog[]>([]);
  const [loadingChannelLogs, setLoadingChannelLogs] = useState(false);
  const [channelLogsError, setChannelLogsError] = useState<string | null>(null);
  const [systemDiagnostics, setSystemDiagnostics] = useState<SystemDiagnosticsSnapshot | null>(null);
  const [loadingSystemDiagnostics, setLoadingSystemDiagnostics] = useState(false);
  const [systemDiagnosticsError, setSystemDiagnosticsError] = useState<string | null>(null);
  const [banRecord, setBanRecord] = useState<BannedUserRecord | null>(() =>
    loadCachedBanRecord(activePlayerId),
  );
  const [banIdCopied, setBanIdCopied] = useState(false);

  const extraAdminIds = useMemo(() => getEffectiveAdminIds(adminsConfig), [adminsConfig]);
  const isAuthorizedAdmin =
    isAdminPlayerId(profile.uid, extraAdminIds) ||
    isAdminPlayerId(detectedIdentity.playerId || profile.uid, extraAdminIds);
  const hasVerifiedAdminSession = () =>
    isAuthorizedAdmin &&
    adminUnlocked &&
    Boolean(
      adminSessionTokenRef.current &&
        adminSessionTokenRef.current.trim().length >= 24 &&
        adminSessionTokenRef.current.includes('.'),
    );
  const isBanned = Boolean(banRecord) && !isAuthorizedAdmin;
  const isBannedRef = useRef(isBanned);
  isBannedRef.current = isBanned;

  const activeRequiredChannels = useMemo(
    () => getActiveRequiredChannels(channelsConfig),
    [channelsConfig],
  );
  const channelsGateEnabled = channelsConfig.enabled && activeRequiredChannels.length > 0;
  const mustJoinGateEnabled = useMemo(
    () => isMustJoinChannelsEnabled(channelsConfig),
    [channelsConfig],
  );
  const activeChannelsSignature = useMemo(
    () =>
      activeRequiredChannels
        .map((c) => c.handle.trim().toLowerCase())
        .sort()
        .join(','),
    [activeRequiredChannels],
  );
  const hasRequiredPayoutChannel = useMemo(
    () =>
      activeRequiredChannels.some((ch) =>
        /payout|pay/i.test(`${ch.id} ${ch.handle} ${ch.title}`),
      ),
    [activeRequiredChannels],
  );
  const liveTaskChannelLinks = useMemo(
    () =>
      resolveLiveTaskChannelLinks({
        requiredChannels: activeRequiredChannels,
        payoutChannelUrl: hasRequiredPayoutChannel ? undefined : getTelegramChannelUrl(payoutChannel),
        getCodeChannelUrl: channelsConfig.getCodeChannelUrl || undefined,
      }),
    [activeRequiredChannels, channelsConfig.getCodeChannelUrl, hasRequiredPayoutChannel, payoutChannel],
  );
  const liveTaskChannelLinksRef = useRef(liveTaskChannelLinks);
  liveTaskChannelLinksRef.current = liveTaskChannelLinks;

  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const initialAction = parseStartAppAction(
      detectedIdentity.startParam || getBrowserStartParam(),
    );
    return initialAction.actionTab || 'farm';
  });
  const [subView, setSubView] = useState<SubView>(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1') {
      return 'admin';
    }
    return 'none';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [watchingAdLoading, setWatchingAdLoading] = useState(false);
  const [activeAdNetwork, setActiveAdNetwork] = useState<AdNetworkId | null>(null);
  const [activeAdAction, setActiveAdAction] = useState<
    'watch_ad' | 'ad_network' | 'adsgram_task' | null
  >(null);
  const [adModalState, setAdModalState] = useState<{
    open: boolean;
    kind: ModalAdActionKind;
    notice?: string | null;
    network?: AdNetworkId | null;
    pendingEggs?: number | null;
    promoCode?: string | null;
    promoRewardSummary?: string | null;
    chickenBreed?: ChickenBreedId | null;
    chickenQty?: number | null;
    minerCostCoins?: number | null;
    reinvestEggs?: number | null;
    reinvestCoins?: number | null;
    reinvestBonusPercent?: number | null;
    mandatory?: boolean;
  }>({
    open: false,
    kind: 'watch_ad',
    notice: null,
    network: null,
  });
  const [showReinvestModal, setShowReinvestModal] = useState(false);
  const channelLeaveAuditRef = useRef<number>(0);
  const claimPendingAttemptsRef = useRef<{ uid: string; count: number; resolved: boolean }>({
    uid: '',
    count: 0,
    resolved: false,
  });
  const startupAdTriggeredRef = useRef(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => getStoredAudioSettings());
  const musicEnabled = audioSettings.musicEnabled;
  const soundsEnabled = audioSettings.soundsEnabled;
  const soundsEnabledRef = useRef(soundsEnabled);
  soundsEnabledRef.current = soundsEnabled;
  const allAudioMuted = isAllAudioMuted(audioSettings);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());
  const [notificationPermission, setNotificationPermission] = useState(() =>
    getBrowserNotificationPermission(),
  );
  // Basket Full Alerts are mandatory & always enabled
  const notificationsEnabled = true;
  const lastNotifiedCollectedAtRef = useRef<number | null>(getStoredLastNotifiedCycle());
  const [toastText, setToastText] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSignUpBonusModal, setShowSignUpBonusModal] = useState(false);

  const [channelVerification, setChannelVerification] = useState<ChannelVerificationResult | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`chickenland_channels_verified_v1_${activePlayerId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ChannelVerificationResult;
      if (parsed?.allJoined && Date.now() - Number(parsed.checkedAtMs || 0) < 6 * 60 * 60 * 1000) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [checkingChannels, setCheckingChannels] = useState(false);
  const [channelCheckError, setChannelCheckError] = useState<string | null>(null);
  const [showChannelGateModal, setShowChannelGateModal] = useState(false);
  const [pendingPromoClaimCode, setPendingPromoClaimCode] = useState<string | null>(null);
  const pendingPromoClaimCodeRef = useRef<string | null>(null);
  const lastAutoChannelCheckAtRef = useRef<number>(0);
  const channelsConfigRef = useRef(channelsConfig);
  channelsConfigRef.current = channelsConfig;
  const activeRequiredChannelsRef = useRef(activeRequiredChannels);
  activeRequiredChannelsRef.current = activeRequiredChannels;
  const channelVerificationRef = useRef(channelVerification);
  channelVerificationRef.current = channelVerification;
  const mustJoinGateEnabledRef = useRef(mustJoinGateEnabled);
  mustJoinGateEnabledRef.current = mustJoinGateEnabled;
  const membershipVerified = useMemo(
    () => isChannelVerificationSatisfied(channelVerification, channelsConfig),
    [channelVerification, channelsConfig],
  );

  const skipWelcome = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [showSplash, setShowSplash] = useState(() => !skipWelcome);
  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const isOnline = useOnlineStatus();
  const isOnlineRef = useRef<boolean>(isOnline);
  isOnlineRef.current = isOnline;
  const [referralRetryNonce, setReferralRetryNonce] = useState(0);

  const PENDING_REF_STORAGE_KEY = 'chickenland_pending_ref_v1';
  const [pendingRefCode, setPendingRefCode] = useState<string | null>(() => {
    const rawStart = detectedIdentity.startParam || getBrowserStartParam();
    const liveAction = parseStartAppAction(rawStart);
    if (liveAction.referralCode) {
      try {
        localStorage.setItem(PENDING_REF_STORAGE_KEY, liveAction.referralCode);
      } catch {
        // ignore storage errors
      }
      console.log('[ReferralTrace] init:pendingRefCode_from_start_param', {
        referralCode: liveAction.referralCode,
        fromTelegramStartParam: Boolean(detectedIdentity.startParam),
        initialPlayerId: detectedIdentity.playerId || 'pending',
        isTelegramDetected: detectedIdentity.isTelegramDetected,
        online: typeof navigator === 'undefined' ? true : navigator.onLine,
      });
      return liveAction.referralCode;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(PENDING_REF_STORAGE_KEY);
        const storedAction = parseStartAppAction(stored);
        if (storedAction.referralCode) {
          console.log('[ReferralTrace] init:pendingRefCode_restored_from_storage', {
            referralCode: storedAction.referralCode,
            initialPlayerId: detectedIdentity.playerId || 'pending',
            isTelegramDetected: detectedIdentity.isTelegramDetected,
            online: typeof navigator === 'undefined' ? true : navigator.onLine,
          });
          return storedAction.referralCode;
        }
        if (stored) {
          localStorage.removeItem(PENDING_REF_STORAGE_KEY);
        }
      } catch {
        // ignore storage errors
      }
    }
    return null;
  });
  const pendingRefCodeRef = useRef<string | null>(pendingRefCode);
  pendingRefCodeRef.current = pendingRefCode;
  const dataResetInFlightRef = useRef(false);
  const goldenEggClaimInFlightRef = useRef(false);
  const latestTransactionsRef = useRef<TransactionEntry[]>(transactions);
  latestTransactionsRef.current = transactions;
  const referralAttemptedKeysRef = useRef<Set<string>>(new Set());
  const telegramHydrationElapsedRef = useRef<boolean>(false);
  const welcomeCheckedForPlayerRef = useRef<string | null>(null);
  const ensurePromiseRef = useRef<Promise<UserFarmProfile | void>>(Promise.resolve());
  const [isPlayerSynced, setIsPlayerSynced] = useState(false);
  const prevWithdrawalStatusRef = useRef<Map<string, string> | null>(null);
  const seenReferralIdsRef = useRef<{ uid: string; hydrated: boolean; statuses: Map<string, string> }>({
    uid: '',
    hydrated: false,
    statuses: new Map(),
  });
  const appSessionStartedAtRef = useRef<number>(Date.now());
  const userSelectedLangRef = useRef<LanguageCode | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastText(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
    }, 3400);
  }, []);

  // Tick live egg production clock every 10 seconds
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    latestProfileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    applyThemeToDocument(themeMode);
  }, [themeMode]);

  const handleToggleTheme = useCallback(() => {
    playTabTapSound(soundsEnabled);
    setThemeMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      setStoredTheme(next);
      return next;
    });
  }, [soundsEnabled]);

  useEffect(() => {
    if (isBanned) {
      stopAmbientMusic();
      setAdModalState({ open: false, kind: 'watch_ad', notice: null, network: null });
      setShowSettings(false);
      setShowWelcomeModal(false);
      setShowSignUpBonusModal(false);
      setShowChannelGateModal(false);
      return () => stopAmbientMusic();
    }

    syncAmbientMusic(musicEnabled);
    if (!musicEnabled) {
      return () => stopAmbientMusic();
    }

    const handleFirstGesture = () => {
      if (!isBannedRef.current && document.visibilityState !== 'hidden') {
        syncAmbientMusic(true);
      }
    };
    const handleBackgroundPause = () => {
      stopAmbientMusic();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' || isBannedRef.current) {
        stopAmbientMusic();
      } else {
        syncAmbientMusic(true);
      }
    };

    window.addEventListener('pointerdown', handleFirstGesture, { passive: true });
    window.addEventListener('touchend', handleFirstGesture, { passive: true });
    window.addEventListener('click', handleFirstGesture, { passive: true });
    window.addEventListener('keydown', handleFirstGesture, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleBackgroundPause);
    window.addEventListener('blur', handleBackgroundPause);
    window.addEventListener('pageshow', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('touchend', handleFirstGesture);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleBackgroundPause);
      window.removeEventListener('blur', handleBackgroundPause);
      window.removeEventListener('pageshow', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      stopAmbientMusic();
    };
  }, [isBanned, musicEnabled]);

  useEffect(() => {
    const handleOffline = () => {
      console.log('[ReferralTrace] network:offline', {
        pendingRefCode: pendingRefCodeRef.current,
        activePlayerId: activePlayerIdRef.current,
      });
    };
    const handleOnline = () => {
      referralAttemptedKeysRef.current.clear();
      let restoredFromStorage: string | null = null;
      try {
        const stored = localStorage.getItem(PENDING_REF_STORAGE_KEY);
        const storedAction = parseStartAppAction(stored);
        if (storedAction.referralCode) {
          restoredFromStorage = storedAction.referralCode;
          if (pendingRefCodeRef.current !== storedAction.referralCode) {
            pendingRefCodeRef.current = storedAction.referralCode;
            setPendingRefCode(storedAction.referralCode);
          }
        }
      } catch {
        // ignore storage errors
      }
      console.log('[ReferralTrace] network:online -> cleared referralAttemptedKeysRef for retry', {
        pendingRefCode: pendingRefCodeRef.current,
        restoredFromStorage,
        activePlayerId: activePlayerIdRef.current,
        isPlayerSynced,
      });
      setReferralRetryNonce((n) => n + 1);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [isPlayerSynced]);

  useEffect(() => {
    const syncIdentityAndStartParam = () => {
      ensureTelegramWebAppReady();
      const next = resolveActivePlayerIdentity();
      const rawStartParam = next.startParam || getBrowserStartParam();
      const parsed = parseStartAppAction(rawStartParam);

      if (parsed.actionTab) {
        setActiveTab(parsed.actionTab);
        if (pendingRefCodeRef.current && parseStartAppAction(pendingRefCodeRef.current).actionTab) {
          pendingRefCodeRef.current = null;
          setPendingRefCode(null);
          try {
            localStorage.removeItem(PENDING_REF_STORAGE_KEY);
          } catch {
            // ignore storage errors
          }
        }
      } else if (parsed.referralCode) {
        try {
          localStorage.setItem(PENDING_REF_STORAGE_KEY, parsed.referralCode);
        } catch {
          // ignore storage errors
        }
        if (parsed.referralCode !== pendingRefCodeRef.current) {
          console.log('[ReferralTrace] syncIdentityAndStartParam:captured_referral_code', {
            referralCode: parsed.referralCode,
            previousPendingRefCode: pendingRefCodeRef.current,
            nextPlayerId: next.playerId,
            activePlayerId: activePlayerIdRef.current,
            isTelegramDetected: next.isTelegramDetected,
            online: typeof navigator === 'undefined' ? true : navigator.onLine,
          });
          pendingRefCodeRef.current = parsed.referralCode;
          setPendingRefCode(parsed.referralCode);
        }
      } else if (!pendingRefCodeRef.current) {
        try {
          const stored = localStorage.getItem(PENDING_REF_STORAGE_KEY);
          const storedAction = parseStartAppAction(stored);
          if (storedAction.referralCode) {
            console.log('[ReferralTrace] syncIdentityAndStartParam:restored_cached_referral_code', {
              referralCode: storedAction.referralCode,
              nextPlayerId: next.playerId,
              activePlayerId: activePlayerIdRef.current,
              isTelegramDetected: next.isTelegramDetected,
              online: typeof navigator === 'undefined' ? true : navigator.onLine,
            });
            pendingRefCodeRef.current = storedAction.referralCode;
            setPendingRefCode(storedAction.referralCode);
          }
        } catch {
          // ignore storage errors
        }
      }

      if (next.isTelegramDetected && next.playerId && next.playerId !== activePlayerIdRef.current) {
        console.log('[ReferralTrace] syncIdentityAndStartParam:telegram_identity_hydrated', {
          fromPlayerId: activePlayerIdRef.current,
          toPlayerId: next.playerId,
          preservedPendingRefCode: pendingRefCodeRef.current,
        });
        referralAttemptedKeysRef.current.clear();
        setDetectedIdentity(next);
        const cached = loadCachedPlayerProfile(next.playerId);
        if (cached) {
          latestProfileRef.current = cached;
          setProfile(cached);
        }
      } else if (next.isTelegramDetected && !detectedIdentity.isTelegramDetected) {
        console.log('[ReferralTrace] syncIdentityAndStartParam:telegram_detected_same_id', {
          playerId: next.playerId || activePlayerIdRef.current,
          preservedPendingRefCode: pendingRefCodeRef.current,
        });
        setDetectedIdentity(next);
      }
    };

    syncIdentityAndStartParam();
    const timers = detectedIdentity.isTelegramDetected
      ? []
      : [50, 150, 400, 900, 1800].map((delay) =>
          window.setTimeout(syncIdentityAndStartParam, delay),
        );
    const unsubActivated = subscribeTelegramAppActivated(syncIdentityAndStartParam);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      unsubActivated();
    };
  }, [detectedIdentity.isTelegramDetected]);

  useEffect(() => {
    if (playerSessionTokenRef.current) return;
    const initData = getTelegramInitData();
    if (!initData) {
      console.log('[ReferralTrace] auth:verify-telegram:skipped_no_initData', {
        activePlayerId,
        isTelegramDetected: detectedIdentity.isTelegramDetected,
        pendingRefCode: pendingRefCodeRef.current,
      });
      return;
    }
    console.log('[ReferralTrace] auth:verify-telegram:request', {
      activePlayerId,
      isTelegramDetected: detectedIdentity.isTelegramDetected,
      pendingRefCode: pendingRefCodeRef.current,
    });
    void safeFetchJson<{ ok?: boolean; verified?: boolean; sessionToken?: string }>(
      '/api/auth/verify-telegram',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      },
    ).then((res) => {
      console.log('[ReferralTrace] auth:verify-telegram:response', {
        activePlayerId,
        ok: Boolean(res?.ok),
        verified: Boolean(res?.verified),
        hasSessionToken: Boolean(res?.sessionToken),
      });
      if (res?.ok && res.verified && res.sessionToken) {
        playerSessionTokenRef.current = res.sessionToken;
        setPlayerSessionToken(res.sessionToken);
      }
    });
  }, [activePlayerId, detectedIdentity.isTelegramDetected, isOnline, referralRetryNonce]);

  const handleToggleMuteAll = useCallback(() => {
    const next = computeMuteAllToggle(audioSettings);
    setAudioSettings(next);
    setStoredAudioSettings(next);
    syncAmbientMusic(next.musicEnabled);
    const nowMuted = isAllAudioMuted(next);
    if (!nowMuted && next.soundsEnabled) {
      playTabTapSound(true);
    }
    triggerHapticFeedback('selection');
    showToast(nowMuted ? 'All music & sound effects muted.' : 'Audio settings restored.');
  }, [audioSettings, showToast]);

  const handleToggleMusic = useCallback(() => {
    const nextMusic = !audioSettings.musicEnabled;
    syncAmbientMusic(nextMusic);
    triggerHapticFeedback('selection');
    const next: AudioSettings = {
      ...audioSettings,
      musicEnabled: nextMusic,
      preMuteMusicEnabled: nextMusic,
      preMuteSoundsEnabled: audioSettings.soundsEnabled,
    };
    setAudioSettings(next);
    setStoredAudioSettings(next);
  }, [audioSettings]);

  const handleToggleSounds = useCallback(() => {
    const nextSounds = !audioSettings.soundsEnabled;
    if (nextSounds) {
      playTabTapSound(true);
    }
    const next: AudioSettings = {
      ...audioSettings,
      soundsEnabled: nextSounds,
      preMuteMusicEnabled: audioSettings.musicEnabled,
      preMuteSoundsEnabled: nextSounds,
    };
    setAudioSettings(next);
    setStoredAudioSettings(next);
  }, [audioSettings]);

  const checkAndNotifyBasketFull = useCallback(() => {
    if (isBannedRef.current) return;
    const current = latestProfileRef.current;
    const now = Date.now();
    const pending = calculatePendingEggs(current, now);
    const perm = getBrowserNotificationPermission();
    setNotificationPermission(perm);

    const shouldNotify = shouldTriggerBasketFullNotification({
      pendingEggs: pending,
      basketCapacity: current.basketCapacity,
      lastCollectedAt: current.lastCollectedAt,
      lastNotifiedCollectedAt: lastNotifiedCollectedAtRef.current,
      isBackgrounded: isDocumentBackgrounded(),
      notificationsEnabled,
      permission: perm,
    });

    if (shouldNotify) {
      lastNotifiedCollectedAtRef.current = current.lastCollectedAt;
      setStoredLastNotifiedCycle(current.lastCollectedAt);
      dispatchBasketFullNotification({
        pendingEggs: pending,
        basketCapacity: current.basketCapacity,
        onClick: () => {
          setSubView('none');
          setActiveTab('farm');
        },
      });
    }
  }, []);

  useEffect(() => {
    checkAndNotifyBasketFull();
  }, [checkAndNotifyBasketFull, nowMs, profile]);

  useEffect(() => {
    const handleVisibilityOrFocusChange = () => {
      setNowMs(Date.now());
      checkAndNotifyBasketFull();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);
    window.addEventListener('blur', handleVisibilityOrFocusChange);
    window.addEventListener('focus', handleVisibilityOrFocusChange);

    const ratePerHour = calculateProductionRate(profile);
    const msLeft = calculateMsUntilBasketFull({
      productionRatePerHour: ratePerHour,
      basketCapacity: profile.basketCapacity,
      lastCollectedAt: profile.lastCollectedAt,
      nowMs: Date.now(),
    });

    let timerId: number | null = null;
    if (msLeft !== null && msLeft > 0 && msLeft <= 2_147_483_647) {
      timerId = window.setTimeout(() => {
        setNowMs(Date.now());
        checkAndNotifyBasketFull();
      }, msLeft + 250);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange);
      window.removeEventListener('blur', handleVisibilityOrFocusChange);
      window.removeEventListener('focus', handleVisibilityOrFocusChange);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [checkAndNotifyBasketFull, profile]);

  // Mandatory basket full browser alert: request notification permission on first interaction when needed
  useEffect(() => {
    if (notificationPermission !== 'default') return;
    let asked = false;
    const askOnce = () => {
      if (asked) return;
      asked = true;
      window.removeEventListener('pointerdown', askOnce);
      void requestBrowserNotificationPermission().then(setNotificationPermission);
    };
    window.addEventListener('pointerdown', askOnce, { passive: true, once: true });
    return () => {
      window.removeEventListener('pointerdown', askOnce);
    };
  }, [notificationPermission]);

  // Verify Firestore connection, fetch server GRAM config & subscribe to live config collections
  useEffect(() => {
    testFirestoreConnection();
    void safeFetchJson<{
      gramDepositAddress?: string;
      gramJettonMaster?: string;
      payoutChannel?: string;
      telegramBotConfigured?: boolean;
      telegramBotUsername?: string;
      telegramAppShortName?: string;
      adminPasscodeSource?: 'database' | 'server_file' | 'env' | 'default' | 'unconfigured';
      adminPasscodeUpdatedAtMs?: number;
      adminNeedsPasscodeSetup?: boolean;
      maintenance?: Partial<MaintenanceConfig>;
      channelsConfig?: ChannelsConfig;
      economy?: Partial<EconomyConfig>;
      minWithdrawEggs?: number;
      perReferRewardCoins?: number;
    }>('/api/config').then((cfg) => {
      if (!cfg) return;
      if (cfg.gramDepositAddress) {
        setDepositAddress(cfg.gramDepositAddress);
      }
      if (cfg.gramJettonMaster) {
        setGramJettonMaster(cfg.gramJettonMaster);
      }
      if (cfg.payoutChannel) {
        setPayoutChannel(cfg.payoutChannel);
      }
      if (typeof cfg.telegramBotConfigured === 'boolean') {
        setServerBotConfigured(cfg.telegramBotConfigured);
      }
      if (cfg.adminPasscodeSource) {
        setAdminPasscodeSource(cfg.adminPasscodeSource);
      }
      if (typeof cfg.adminPasscodeUpdatedAtMs === 'number') {
        setAdminPasscodeUpdatedAtMs(cfg.adminPasscodeUpdatedAtMs);
      }
      if (typeof cfg.adminNeedsPasscodeSetup === 'boolean') {
        setAdminNeedsPasscodeSetup(cfg.adminNeedsPasscodeSetup);
      }
      if (cfg.channelsConfig && Array.isArray(cfg.channelsConfig.channels)) {
        const serverChannels = cfg.channelsConfig;
        setChannelsConfig((prev) =>
          (prev.updatedAtMs || 0) > (serverChannels.updatedAtMs || 0) ? prev : serverChannels,
        );
      }
      if (
        cfg.economy ||
        typeof cfg.minWithdrawEggs === 'number' ||
        typeof cfg.perReferRewardCoins === 'number'
      ) {
        const serverEconomy = resolveEconomyConfig({
          ...cfg.economy,
          minWithdrawEggs: cfg.economy?.minWithdrawEggs ?? cfg.minWithdrawEggs,
          perReferRewardCoins: cfg.economy?.perReferRewardCoins ?? cfg.perReferRewardCoins,
        });
        setEconomyConfig((prev) => {
          const chosen = prev.updatedAtMs > serverEconomy.updatedAtMs ? prev : serverEconomy;
          setCachedLiveEconomyConfig(chosen);
          return chosen;
        });
      }
      if (cfg.maintenance) {
        const serverMaint = resolveMaintenanceConfig(cfg.maintenance);
        setMaintenanceConfig((prev) =>
          prev.updatedAtMs > serverMaint.updatedAtMs ? prev : serverMaint,
        );
        setMaintenanceLoaded(true);
      }
      if (cfg.telegramBotUsername || cfg.telegramAppShortName) {
        cacheDetectedTelegramBotConfig(cfg.telegramBotUsername, cfg.telegramAppShortName);
        setTelegramBotConfig(
          detectBrowserTelegramBotConfig({
            serverBotUsername: cfg.telegramBotUsername,
            serverAppShortName: cfg.telegramAppShortName,
          }),
        );
      }
    });
    const unsubTasks = subscribeToCustomTasks((items) => {
      setCustomTasks(items);
    });
    const unsubAds = subscribeToAdConfig((cfg) => {
      setAdConfig(cfg);
    });
    const unsubChannels = subscribeToChannelsConfig((cfg) => {
      setChannelsConfig(cfg);
    });
    const unsubPromos = subscribeToPromoCodes((codes) => {
      setPromoCodes(codes);
    });
    const unsubAdmins = subscribeToAdminsConfig((cfg) => {
      setAdminsConfig(cfg);
    });
    const unsubLeaderboard = subscribeToLeaderboard((entries) => {
      setLeaderboardEntries(entries);
    });
    const unsubSeason = subscribeToSeasonConfig((cfg) => {
      setSeasonConfig(cfg);
    });
    const unsubPayoutTemplate = subscribeToWithdrawApproveTemplate((tpl) => {
      setWithdrawApproveTemplate(tpl);
    });
    const unsubTaskPricing = subscribeToTaskPricingConfig((pricing) => {
      setTaskPricingConfig(pricing);
    });
    const unsubEconomy = subscribeToEconomyConfig((econ) => {
      setCachedLiveEconomyConfig(econ);
      setEconomyConfig(econ);
    });
    const unsubSystemReset = subscribeToSystemResetConfig((resetCfg) => {
      setSystemResetConfig(resetCfg);
    });
    const unsubMaintenance = subscribeToMaintenanceConfig((maintCfg) => {
      setMaintenanceConfig(maintCfg);
      setMaintenanceLoaded(true);
    });
    const maintenanceLoadSafetyTimer = window.setTimeout(() => {
      setMaintenanceLoaded(true);
    }, 1500);
    return () => {
      unsubTasks();
      unsubAds();
      unsubChannels();
      unsubPromos();
      unsubAdmins();
      unsubLeaderboard();
      unsubSeason();
      unsubPayoutTemplate();
      unsubTaskPricing();
      unsubEconomy();
      unsubSystemReset();
      unsubMaintenance();
      window.clearTimeout(maintenanceLoadSafetyTimer);
    };
  }, []);

  const applyLocalSystemResetForEpoch = useCallback((epochMs: number) => {
    const targetUid = activePlayerIdRef.current;
    if (!targetUid || !epochMs) return;
    const seenEpochKey = `chickenland_reset_epoch_${targetUid}`;
    const liveLaunchRef = parseStartAppAction(getBrowserStartParam()).referralCode;
    try {
      localStorage.setItem(seenEpochKey, String(epochMs));
      localStorage.removeItem(`chickenland_profile_cache_v1_${targetUid}`);
      localStorage.removeItem(`chickenland_channels_verified_v1_${targetUid}`);
      localStorage.removeItem(`alphagram_referral_verified_v1_${targetUid}`);
      localStorage.removeItem(`alphagram_verified_tasks_v1_${targetUid}`);
      if (liveLaunchRef) {
        localStorage.setItem(PENDING_REF_STORAGE_KEY, liveLaunchRef);
      } else {
        localStorage.removeItem('chickenland_pending_ref_v1');
      }
      localStorage.removeItem(`chickenland_signup_bonus_seen_${targetUid}`);
      clearStoredGoldenEggClaimAtMs(targetUid);
    } catch {
      // ignore storage errors
    }

    const current = latestProfileRef.current;
    const { profile: starter } = createDefaultProfile(
      targetUid,
      current.displayName,
      current.handle,
      Date.now(),
      current.photoUrl,
    );
    const freshProfile: UserFarmProfile = {
      ...starter,
      language: current.language || starter.language,
      resetEpochMs: epochMs,
    };

    latestProfileRef.current = freshProfile;
    setProfile(freshProfile);
    saveCachedPlayerProfile(freshProfile);
    setTransactions([]);
    setReferralTransactions([]);
    setDeposits([]);
    setWithdrawals([]);
    setReferrals([]);
    setServerReferralIds([]);
    setChannelVerification(null);
    setAllWithdrawRequests([]);
    setBannedUsers([]);
    setChannelCheckError(null);
    setPendingRefCode(liveLaunchRef);
    pendingRefCodeRef.current = liveLaunchRef;
    referralAttemptedKeysRef.current.clear();
    claimPendingAttemptsRef.current = { uid: '', count: 0, resolved: false };
    prevWithdrawalStatusRef.current = null;
    seenReferralIdsRef.current = { uid: targetUid, hydrated: true, statuses: new Map() };
  }, []);

  useEffect(() => {
    const epochMs = systemResetConfig.resetEpochMs;
    if (!epochMs || !isPlayerSynced) return;
    const current = latestProfileRef.current;
    if (!current?.uid || current.uid !== activePlayerId) return;
    if ((current.resetEpochMs ?? 0) >= epochMs) return;

    const seenEpochKey = `chickenland_reset_epoch_${current.uid}`;
    let alreadyHandled = false;
    try {
      alreadyHandled = localStorage.getItem(seenEpochKey) === String(epochMs);
    } catch {
      alreadyHandled = false;
    }
    if (alreadyHandled) return;

    applyLocalSystemResetForEpoch(epochMs);
    showToast('System was reset cleanly — your starter farm is ready!');
  }, [activePlayerId, applyLocalSystemResetForEpoch, isPlayerSynced, profile.resetEpochMs, showToast, systemResetConfig.resetEpochMs]);

  // Always require Admin Passcode again on every fresh webapp open/resume
  useEffect(() => {
    const resetAdminLock = () => {
      setAdminUnlocked(false);
      setAdminSessionToken('');
    };
    window.addEventListener('pagehide', resetAdminLock);
    return () => window.removeEventListener('pagehide', resetAdminLock);
  }, []);

  useEffect(() => {
    setBanRecord(loadCachedBanRecord(activePlayerId));
    const unsubBan = subscribeToPlayerBanStatus(activePlayerId, (ban) => {
      setBanRecord(ban);
    });
    return () => unsubBan();
  }, [activePlayerId]);

  useEffect(() => {
    if (
      subView !== 'admin' ||
      !adminUnlocked ||
      !adminSessionToken ||
      !isAdminPlayerId(profile.uid, extraAdminIds)
    ) {
      return;
    }
    const unsubWdReqs = subscribeToAllWithdrawRequests((items) => {
      setAllWithdrawRequests(items);
    });
    const unsubRecentPlayers = subscribeToRecentPlayers((players) => {
      setRecentPlayers(players);
    }, 50);
    const unsubBannedUsers = subscribeToBannedUsers((items) => {
      setBannedUsers(items);
    });
    return () => {
      unsubWdReqs();
      unsubRecentPlayers();
      unsubBannedUsers();
    };
  }, [adminSessionToken, adminUnlocked, extraAdminIds, profile.uid, subView]);

  // Ensure active player exists in Firestore and subscribe live to all subcollections
  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | null = null;
    let syncedSuccess = false;
    setIsPlayerSynced(false);

    const handlePlayerCallbacks = {
      onProfile: (p: UserFarmProfile, meta?: { fromCache: boolean }) => {
        setStoredLanguage(p.language, p.uid);
        latestProfileRef.current = p;
        setProfile(p);
        if (!meta?.fromCache) {
          setIsPlayerSynced(true);
        }
      },
      onTransactions: (txs: TransactionEntry[]) => setTransactions(txs),
      onReferralTransactions: (refTxs: TransactionEntry[]) => setReferralTransactions(refTxs),
      onDeposits: (deps: DepositOrder[]) => setDeposits(deps),
      onWithdrawals: (wds: WithdrawalOrder[]) => {
        const prevMap = prevWithdrawalStatusRef.current;
        const nextMap = new Map<string, string>();
        let newlyApproved = false;
        for (const w of wds) {
          nextMap.set(w.id, w.status);
          if (prevMap) {
            const prevStatus = prevMap.get(w.id);
            if (
              (prevStatus === 'pending' || prevStatus === 'processing') &&
              w.status === 'approved'
            ) {
              newlyApproved = true;
            }
          }
        }
        prevWithdrawalStatusRef.current = nextMap;
        if (newlyApproved) {
          triggerWithdrawalConfetti();
          showToast('Withdrawal approved & completed!');
        }
        setWithdrawals(wds);
      },
      onReferrals: (refs: ReferralRecord[]) => {
        const currentTracker = seenReferralIdsRef.current;
        if (currentTracker.uid !== activePlayerId) {
          const initialStatuses = new Map<string, string>();
          for (const r of refs) {
            const key = r.referredUid || r.id;
            if (key) initialStatuses.set(key, r.status);
          }
          seenReferralIdsRef.current = {
            uid: activePlayerId,
            hydrated: true,
            statuses: initialStatuses,
          };
        } else if (!currentTracker.hydrated) {
          for (const r of refs) {
            const key = r.referredUid || r.id;
            if (key) currentTracker.statuses.set(key, r.status);
          }
          currentTracker.hydrated = true;
        } else {
          const newlyJoinedPending: ReferralRecord[] = [];
          const newlyActivated: ReferralRecord[] = [];
          for (const r of refs) {
            const key = r.referredUid || r.id;
            if (!key) continue;
            const prevStatus = currentTracker.statuses.get(key);
            currentTracker.statuses.set(key, r.status);
            if (!prevStatus) {
              if (!r.createdAtMs || r.createdAtMs >= appSessionStartedAtRef.current - 120_000) {
                if (r.status === 'active') {
                  newlyActivated.push(r);
                } else {
                  newlyJoinedPending.push(r);
                }
              }
            } else if (prevStatus === 'pending' && r.status === 'active') {
              newlyActivated.push(r);
            }
          }
          if (newlyActivated.length > 0) {
            const newest = newlyActivated[0];
            const friendLabel =
              newest.referredName ||
              (newest.referredHandle ? `@${newest.referredHandle.replace(/^@/, '')}` : 'A friend');
            const defaultReferCoins = economyConfigRef.current.perReferRewardCoins;
            const coinsEarned = Math.max(
              defaultReferCoins,
              Number(newest.coinsEarned || defaultReferCoins),
            );
            triggerRewardConfetti();
            playClaimSound(soundsEnabledRef.current);
            triggerHapticFeedback('success');
            if (newlyActivated.length === 1) {
              showToast(`🎉 ${friendLabel} active! +${coinsEarned.toLocaleString()} Coins earned!`);
            } else {
              showToast(`🎉 ${newlyActivated.length} Referrals active! Check Friends tab.`);
            }
          } else if (newlyJoinedPending.length > 0) {
            const newest = newlyJoinedPending[0];
            const friendLabel =
              newest.referredName ||
              (newest.referredHandle ? `@${newest.referredHandle.replace(/^@/, '')}` : 'A friend');
            triggerHapticFeedback('light');
            const perRefer = economyConfigRef.current.perReferRewardCoins;
            showToast(`👋 ${friendLabel} joined! +${perRefer.toLocaleString()}c unlocks on 1st hen.`);
          }
        }
        setReferrals(refs);
      },
    };

    // Always attach live Firestore snapshot listener right away so cached & queued writes stay reactive
    const unsubPlayer = subscribeToPlayer(activePlayerId, handlePlayerCallbacks);

    const init = async (attempt = 0): Promise<void> => {
      try {
        const { profile: ensured, isNewPlayer, fromCache } = await ensurePlayerInFirestore(activePlayerId, {
          displayName: detectedIdentity.displayName,
          handle: detectedIdentity.handle,
          photoUrl: detectedIdentity.photoUrl,
          isTelegramDetected: detectedIdentity.isTelegramDetected,
        });
        if (cancelled) return;

        syncedSuccess = !fromCache;
        const resolvedProfile: UserFarmProfile =
          userSelectedLangRef.current && userSelectedLangRef.current !== ensured.language
            ? { ...ensured, language: userSelectedLangRef.current }
            : ensured;
        setStoredLanguage(resolvedProfile.language, activePlayerId);
        latestProfileRef.current = resolvedProfile;
        setProfile(resolvedProfile);
        setIsPlayerSynced(!fromCache);
        console.log('[ReferralTrace] playerSync:ensurePlayerInFirestore', {
          activePlayerId,
          isNewPlayer,
          fromCache,
          isPlayerSynced: !fromCache,
          referredBy: resolvedProfile.referredBy || '',
          pendingRefCode: pendingRefCodeRef.current,
          online: isOnlineRef.current,
        });

        const seenKey = `chickenland_signup_bonus_seen_${activePlayerId}`;
        let alreadySeen = false;
        try {
          alreadySeen = localStorage.getItem(seenKey) === '1';
        } catch {
          alreadySeen = false;
        }
        if (
          shouldShowSignUpBonusClaim({
            isNewPlayer,
            alreadyClaimedInStorage: alreadySeen,
            skipWelcome,
            profile: resolvedProfile,
            nowMs: Date.now(),
          })
        ) {
          setShowSignUpBonusModal(true);
        }

        if (!skipWelcome && welcomeCheckedForPlayerRef.current !== activePlayerId) {
          welcomeCheckedForPlayerRef.current = activePlayerId;
          const pending = calculatePendingEggs(ensured, Date.now());
          if (pending >= 10) {
            setShowWelcomeModal(true);
          }
        }

        if (fromCache && attempt < 3 && !cancelled) {
          retryTimer = window.setTimeout(() => {
            if (!cancelled) {
              ensurePromiseRef.current = init(attempt + 1);
            }
          }, 1500 * Math.pow(2, attempt));
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('[ReferralTrace] playerSync:ensure_error', {
          activePlayerId,
          attempt,
          pendingRefCode: pendingRefCodeRef.current,
          message: err instanceof Error ? err.message : String(err),
        });
        const cached = loadCachedPlayerProfile(activePlayerId);
        if (cached) {
          latestProfileRef.current = cached;
          setProfile(cached);
        }
        if (attempt < 3) {
          retryTimer = window.setTimeout(() => {
            if (!cancelled) {
              ensurePromiseRef.current = init(attempt + 1);
            }
          }, 1200 * Math.pow(2, attempt));
        } else {
          showToast('Using saved local farm data while reconnecting to cloud.');
        }
      }
    };

    const handleOnlineRetry = () => {
      if (!cancelled && !syncedSuccess) {
        console.log('[ReferralTrace] playerSync:online_retry', {
          activePlayerId,
          pendingRefCode: pendingRefCodeRef.current,
        });
        ensurePromiseRef.current = init(0);
      }
    };
    window.addEventListener('online', handleOnlineRetry);

    ensurePromiseRef.current = init(0);

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      window.removeEventListener('online', handleOnlineRetry);
      unsubPlayer();
    };
  }, [
    activePlayerId,
    detectedIdentity.displayName,
    detectedIdentity.handle,
    detectedIdentity.isTelegramDetected,
    detectedIdentity.photoUrl,
    showToast,
    skipWelcome,
  ]);

  // Reliably link pending referral once online & player is synced (waits for Telegram SDK hydration and caches offline)
  useEffect(() => {
    const parsedRefAction = parseStartAppAction(pendingRefCode);
    if (parsedRefAction.actionTab) {
      setActiveTab(parsedRefAction.actionTab);
      pendingRefCodeRef.current = null;
      setPendingRefCode(null);
      try {
        localStorage.removeItem(PENDING_REF_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      return;
    }
    const refCode = (parsedRefAction.referralCode || '').trim();
    if (!refCode || isBanned) return;

    const currentProfile = latestProfileRef.current;
    const targetUid = currentProfile?.uid || activePlayerId;
    const inActiveTelegramWebView = ensureTelegramWebAppReady() || hasTelegramRuntimeContext();

    console.log('[ReferralTrace] referralEffect:evaluate', {
      refCode,
      activePlayerId,
      profileUid: currentProfile?.uid || '',
      profileReferredBy: currentProfile?.referredBy || '',
      isTelegramDetected: detectedIdentity.isTelegramDetected,
      inActiveTelegramWebView,
      isPlayerSynced,
      isOnline,
      referralRetryNonce,
      attemptedKeys: Array.from(referralAttemptedKeysRef.current),
    });

    // Wait for Telegram SDK hydration BEFORE checking guest referredBy or clearing pendingRefCode,
    // so a guest localStorage profile never overwrites or wipes a Telegram referral link before tg_* hydrates.
    if (
      inActiveTelegramWebView &&
      !detectedIdentity.isTelegramDetected &&
      !/^tg_/.test(targetUid) &&
      !telegramHydrationElapsedRef.current
    ) {
      console.log('[ReferralTrace] referralEffect:waiting_telegram_hydration', {
        refCode,
        targetUid,
        isOnline,
        isPlayerSynced,
      });
      const hydrationTimer = window.setTimeout(() => {
        telegramHydrationElapsedRef.current = true;
        console.log('[ReferralTrace] referralEffect:telegram_hydration_timer_fired', {
          refCode,
          activePlayerId: activePlayerIdRef.current,
          isOnline: isOnlineRef.current,
        });
        setReferralRetryNonce((n) => n + 1);
      }, 1950);
      return () => window.clearTimeout(hydrationTimer);
    }

    if (!isOnline || !isPlayerSynced) {
      try {
        localStorage.setItem(PENDING_REF_STORAGE_KEY, refCode);
      } catch {
        // ignore storage errors
      }
      console.log('[ReferralTrace] referralEffect:cached_waiting_sync_or_online', {
        refCode,
        targetUid,
        isOnline,
        isPlayerSynced,
      });
      return;
    }

    if (!currentProfile?.uid || currentProfile.uid !== activePlayerId) {
      console.log('[ReferralTrace] referralEffect:waiting_profile_match', {
        refCode,
        activePlayerId,
        profileUid: currentProfile?.uid || '',
      });
      return;
    }

    const clearPendingRef = (reason: string) => {
      console.log('[ReferralTrace] clearPendingRef', {
        reason,
        refCode,
        targetUid,
      });
      pendingRefCodeRef.current = null;
      setPendingRefCode(null);
      try {
        localStorage.removeItem(PENDING_REF_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete('ref');
          url.searchParams.delete('start');
          url.searchParams.delete('startapp');
          url.searchParams.delete('start_param');
          url.searchParams.delete('tgWebAppStartParam');
          window.history.replaceState({}, '', url.toString());
        } catch {
          // ignore history errors
        }
      }
    };

    const markReferralVerifiedLocally = (referrerUid: string, activated?: boolean) => {
      try {
        localStorage.setItem(
          `alphagram_referral_verified_v1_${targetUid}`,
          JSON.stringify({
            status: 'verified',
            referrerId: referrerUid,
            verifiedAtMs: Date.now(),
          }),
        );
      } catch {
        // ignore storage errors
      }
      setProfile((prev) => {
        if (prev.uid !== targetUid) return prev;
        const nextActivated =
          typeof activated === 'boolean' ? prev.referralActivated || activated : prev.referralActivated;
        if (prev.referredBy && prev.referralActivated === nextActivated) return prev;
        const next: UserFarmProfile = {
          ...prev,
          referredBy: prev.referredBy || referrerUid,
          referralActivated: nextActivated,
        };
        latestProfileRef.current = next;
        saveCachedPlayerProfile(next);
        return next;
      });
    };

    const syncDirectReferralRecord = async (referrerIdValue: string, userProfile: UserFarmProfile) => {
      try {
        const tgInit = getTelegramInitData();
        const sessionTok = playerSessionTokenRef.current;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (sessionTok) {
          headers.Authorization = `Bearer ${sessionTok}`;
        }
        if (tgInit) {
          headers['x-telegram-init-data'] = tgInit;
        }
        await fetch(resolveApiUrl('/api/referrals'), {
          method: 'POST',
          cache: 'no-store',
          headers,
          body: JSON.stringify({
            userId: targetUid,
            referrerId: referrerIdValue,
            displayName: userProfile.displayName,
            handle: userProfile.handle,
            photoUrl: userProfile.photoUrl,
            initData: tgInit,
            token: sessionTok,
          }),
        });
      } catch {
        // Non-fatal fallback
      }
    };

    if (currentProfile.referredBy) {
      markReferralVerifiedLocally(currentProfile.referredBy, currentProfile.referralActivated);
      void syncDirectReferralRecord(currentProfile.referredBy, currentProfile);
      clearPendingRef('profile_already_has_referredBy');
      return;
    }

    const sendLocalReferralDmFallback = async (
      event: 'referral_pending' | 'referral_joined',
      referrerUid: string,
      coinsRewarded: number,
    ) => {
      const localBot = getLocalAdminBotConfig();
      const numericReferrerId = extractTelegramNumericUserId(referrerUid);
      if (!localBot || !numericReferrerId) return;
      try {
        const msg = buildReferralBotNotificationMessage({
          event,
          referredName: currentProfile.displayName,
          referredHandle: currentProfile.handle,
          rewardCoins: coinsRewarded,
        });
        await fetch(`https://api.telegram.org/bot${localBot.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: numericReferrerId,
            text: msg,
            parse_mode: 'HTML',
          }),
        });
      } catch {
        // Ignore browser preview DM errors
      }
    };

    const runAttempt = () => {
      if (!isOnlineRef.current) {
        console.log('[ReferralTrace] runAttempt:aborted_offline', {
          targetUid,
          refCode,
        });
        return;
      }
      const attemptKey = `${targetUid}::${refCode.toUpperCase()}`;
      if (referralAttemptedKeysRef.current.has(attemptKey)) {
        console.log('[ReferralTrace] runAttempt:already_in_flight_or_attempted', {
          attemptKey,
        });
        return;
      }
      referralAttemptedKeysRef.current.add(attemptKey);
      console.log('[ReferralTrace] runAttempt:starting', {
        attemptKey,
        targetUid,
        refCode,
      });

      const applyReferral = async () => {
        const isStillSamePlayer = () => activePlayerIdRef.current === targetUid;
        await ensurePromiseRef.current?.catch(() => undefined);
        if (!isStillSamePlayer()) {
          console.log('[ReferralTrace] applyReferral:player_changed_before_ensure', {
            targetUid,
            currentActivePlayerId: activePlayerIdRef.current,
          });
          referralAttemptedKeysRef.current.delete(attemptKey);
          return;
        }
        const latestBefore = latestProfileRef.current;
        if (latestBefore.uid === targetUid && latestBefore.referredBy) {
          markReferralVerifiedLocally(latestBefore.referredBy);
          clearPendingRef('already_referred_after_ensure');
          return;
        }
        try {
          const tgInitData = getTelegramInitData();
          const primaryEndpoint = tgInitData ? '/api/referral/claim' : '/api/referrals/apply';
          console.log('[ReferralTrace] applyReferral:api_request', {
            endpoint: primaryEndpoint,
            targetUid,
            refCode,
            hasTgInitData: Boolean(tgInitData),
            hasSessionToken: Boolean(playerSessionTokenRef.current),
          });
          let response = await fetch(resolveApiUrl(primaryEndpoint), {
            method: 'POST',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: targetUid,
              referrerId: refCode,
              refCode,
              displayName: latestBefore.displayName,
              handle: latestBefore.handle,
              photoUrl: latestBefore.photoUrl,
              initData: tgInitData,
              token: playerSessionTokenRef.current,
            }),
          });
          if (tgInitData && response.status === 401) {
            console.log('[ReferralTrace] applyReferral:claim_401_fallback_to_apply', {
              targetUid,
              refCode,
            });
            response = await fetch(resolveApiUrl('/api/referrals/apply'), {
              method: 'POST',
              cache: 'no-store',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerId: targetUid,
                refCode,
                displayName: latestBefore.displayName,
                handle: latestBefore.handle,
                photoUrl: latestBefore.photoUrl,
                initData: tgInitData,
                token: playerSessionTokenRef.current,
              }),
            });
          }
          const contentType = (response.headers.get('content-type') || '').toLowerCase();
          const payload = (
            contentType.includes('application/json') ? await response.json().catch(() => null) : null
          ) as {
            ok?: boolean;
            claimed?: boolean;
            applied?: boolean;
            activated?: boolean;
            referralActivated?: boolean;
            alreadyLinked?: boolean;
            reason?: string;
            referrerUid?: string;
            referrerName?: string;
            coinsRewarded?: number;
            bonusAwarded?: number;
            referredBonusCoins?: number;
            nextReferredCoins?: number;
            botDmSent?: boolean;
            botDmEvent?: 'referral_pending' | 'referral_joined';
          } | null;

          console.log('[ReferralTrace] applyReferral:api_response', {
            status: response.status,
            ok: Boolean(payload?.ok),
            claimed: Boolean(payload?.claimed),
            applied: Boolean(payload?.applied),
            activated: Boolean(payload?.activated ?? payload?.referralActivated),
            alreadyLinked: Boolean(payload?.alreadyLinked),
            reason: payload?.reason || null,
            referrerUid: payload?.referrerUid || null,
            botDmSent: Boolean(payload?.botDmSent),
            botDmEvent: payload?.botDmEvent || null,
          });

          if (!isStillSamePlayer()) {
            console.log('[ReferralTrace] applyReferral:player_changed_after_api', {
              targetUid,
              currentActivePlayerId: activePlayerIdRef.current,
            });
            referralAttemptedKeysRef.current.delete(attemptKey);
            return;
          }

          if (response.ok && payload?.ok) {
            if (payload.applied || payload.claimed) {
              const serverNextCoins = Number(payload.nextReferredCoins);
              const resolvedReferrer = payload.referrerUid || refCode;
              const isActivatedNow = Boolean(payload.activated ?? payload.referralActivated);
              const dmEvent: 'referral_pending' | 'referral_joined' = isActivatedNow
                ? 'referral_joined'
                : 'referral_pending';
              setProfile((prev) => {
                if (prev.uid !== targetUid || prev.referredBy) return prev;
                const next: UserFarmProfile = {
                  ...prev,
                  referredBy: resolvedReferrer,
                  referralActivated: prev.referralActivated || isActivatedNow,
                  coins: Number.isFinite(serverNextCoins) ? serverNextCoins : prev.coins,
                };
                latestProfileRef.current = next;
                saveCachedPlayerProfile(next);
                return next;
              });
              markReferralVerifiedLocally(resolvedReferrer, isActivatedNow);
              void syncDirectReferralRecord(resolvedReferrer, latestBefore);
              if (!payload.botDmSent && payload.referrerUid) {
                void sendLocalReferralDmFallback(
                  dmEvent,
                  payload.referrerUid,
                  Number(
                    payload.bonusAwarded ??
                      payload.coinsRewarded ??
                      economyConfigRef.current.perReferRewardCoins,
                  ) || economyConfigRef.current.perReferRewardCoins,
                );
              }
              triggerRewardConfetti();
              playClaimSound(soundsEnabledRef.current);
              triggerHapticFeedback('success');
              showToast(
                `🎉 Joined via ${payload.referrerName || 'a friend'}! Referral link active.`,
              );
              clearPendingRef('api_referral_linked');
              return;
            }
            if (payload.reason === 'already_linked' || payload.alreadyLinked) {
              if (payload.referrerUid) {
                markReferralVerifiedLocally(
                  payload.referrerUid,
                  Boolean(payload.activated ?? payload.referralActivated),
                );
              }
              clearPendingRef('api_already_linked');
              return;
            }
            if (payload.reason === 'self_referral') {
              clearPendingRef('api_self_referral');
              return;
            }
            if (payload.reason === 'invalid_code') {
              clearPendingRef('api_invalid_code');
              return;
            }
          } else if (payload?.reason === 'invalid_code') {
            clearPendingRef('api_4xx_invalid_code');
            return;
          }
        } catch (apiErr) {
          console.warn('[ReferralTrace] applyReferral:api_error_falling_back_to_firestore', {
            targetUid,
            refCode,
            message: apiErr instanceof Error ? apiErr.message : String(apiErr),
          });
        }

        if (!isStillSamePlayer()) {
          referralAttemptedKeysRef.current.delete(attemptKey);
          return;
        }

        try {
          const snapshotProfile =
            latestProfileRef.current.uid === targetUid ? latestProfileRef.current : currentProfile;
          console.log('[ReferralTrace] applyReferral:calling_firestore_fallback', {
            uid: snapshotProfile.uid,
            refCode,
            hasReferredBy: Boolean(snapshotProfile.referredBy),
          });
          const refRes = await applyReferralCodeInFirestore(
            snapshotProfile,
            refCode,
            economyConfigRef.current.perReferRewardCoins,
          );
          if (!isStillSamePlayer()) {
            console.log('[ReferralTrace] applyReferral:player_changed_after_firestore', {
              targetUid,
              currentActivePlayerId: activePlayerIdRef.current,
            });
            referralAttemptedKeysRef.current.delete(attemptKey);
            return;
          }
          if (!('error' in refRes)) {
            console.log('[ReferralTrace] applyReferral:firestore_linked_success', {
              uid: refRes.profile.uid,
              referrerUid: refRes.referrerUid,
              activated: refRes.activated,
              coinsRewarded: refRes.coinsRewarded,
            });
            latestProfileRef.current = refRes.profile;
            setProfile(refRes.profile);
            saveCachedPlayerProfile(refRes.profile);
            markReferralVerifiedLocally(refRes.referrerUid, refRes.activated);
            void syncDirectReferralRecord(refRes.referrerUid, refRes.profile);
            triggerRewardConfetti();
            playClaimSound(soundsEnabledRef.current);
            triggerHapticFeedback('success');
            showToast(`🎉 Joined via ${refRes.referrerName}! Referral link active.`);
            const notifyEvent: 'referral_pending' | 'referral_joined' = refRes.activated
              ? 'referral_joined'
              : 'referral_pending';
            const notifyRewardCoins = refRes.activated
              ? refRes.coinsRewarded
              : economyConfigRef.current.perReferRewardCoins;
            const notifyPayload = await safeFetchJson<{ ok?: boolean; sent?: boolean }>('/api/referrals/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: notifyEvent,
                referrerUid: refRes.referrerUid,
                referredUid: refRes.profile.uid,
                referredName: refRes.profile.displayName,
                referredHandle: refRes.profile.handle,
                rewardCoins: notifyRewardCoins,
                initData: getTelegramInitData(),
                token: playerSessionTokenRef.current,
              }),
            });
            console.log('[ReferralTrace] applyReferral:firestore_notify_result', {
              event: notifyEvent,
              referrerUid: refRes.referrerUid,
              sent: Boolean(notifyPayload?.sent),
            });
            if (!notifyPayload?.sent) {
              await sendLocalReferralDmFallback(notifyEvent, refRes.referrerUid, notifyRewardCoins);
            }
            clearPendingRef('firestore_referral_linked');
            return;
          }

          console.warn('[ReferralTrace] applyReferral:firestore_returned_error', {
            uid: targetUid,
            refCode,
            error: refRes.error,
          });
          const errLow = refRes.error.toLowerCase();
          if (
            errLow.includes('not found') ||
            errLow.includes('already') ||
            errLow.includes('own') ||
            errLow.includes('yourself') ||
            errLow.includes('invalid')
          ) {
            clearPendingRef(`firestore_terminal_error:${refRes.error}`);
          } else {
            referralAttemptedKeysRef.current.delete(attemptKey);
          }
        } catch (fsErr) {
          console.warn('[ReferralTrace] applyReferral:firestore_exception_preserving_pending_ref', {
            uid: targetUid,
            refCode,
            message: fsErr instanceof Error ? fsErr.message : String(fsErr),
          });
          referralAttemptedKeysRef.current.delete(attemptKey);
        }
      };

      void applyReferral();
    };

    runAttempt();
    return undefined;
  }, [
    activePlayerId,
    detectedIdentity.isTelegramDetected,
    isBanned,
    isOnline,
    isPlayerSynced,
    pendingRefCode,
    profile.referredBy,
    referralRetryNonce,
    showToast,
  ]);

  // Recover pending bot /start referrals when user opens Mini App via bottom-left "Open" menu button (no startapp query param)
  useEffect(() => {
    if (!isOnline || !isPlayerSynced || isBanned) return;
    if (pendingRefCode) return;
    const currentProfile = latestProfileRef.current;
    if (!currentProfile?.uid || currentProfile.uid !== activePlayerId) return;
    if (currentProfile.referredBy) return;
    if (!extractTelegramNumericUserId(currentProfile.uid)) return;

    const targetUid = currentProfile.uid;
    if (claimPendingAttemptsRef.current.uid !== targetUid) {
      claimPendingAttemptsRef.current = { uid: targetUid, count: 0, resolved: false };
    }
    if (claimPendingAttemptsRef.current.resolved || claimPendingAttemptsRef.current.count >= 4) {
      return;
    }

    let cancelled = false;
    let retryTimer: number | null = null;
    let inFlight = false;

    const attemptClaimPending = async () => {
      if (cancelled || inFlight || !isOnlineRef.current) return;
      if (claimPendingAttemptsRef.current.resolved || claimPendingAttemptsRef.current.count >= 4) return;
      if (pendingRefCodeRef.current) return;
      inFlight = true;
      try {
        await ensurePromiseRef.current?.catch(() => undefined);
        if (cancelled || activePlayerIdRef.current !== targetUid) return;
        const latest = latestProfileRef.current;
        if (latest.referredBy) {
          claimPendingAttemptsRef.current.resolved = true;
          return;
        }
        claimPendingAttemptsRef.current.count += 1;
        console.log('[ReferralTrace] claimPending:request', {
          targetUid,
          attempt: claimPendingAttemptsRef.current.count,
        });

        const res = await fetch(resolveApiUrl('/api/referrals/claim-pending'), {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: targetUid,
            displayName: latest.displayName,
            handle: latest.handle,
            photoUrl: latest.photoUrl,
            initData: getTelegramInitData(),
            token: playerSessionTokenRef.current,
          }),
        });
        if (res.ok) {
          const payload = (await res.json().catch(() => null)) as {
            ok?: boolean;
            applied?: boolean;
            alreadyApplied?: boolean;
            activated?: boolean;
            referralActivated?: boolean;
            reason?: string;
            referrerUid?: string;
            referrerName?: string;
            referredBonusCoins?: number;
            nextReferredCoins?: number;
            botDmSent?: boolean;
            botDmEvent?: 'referral_pending' | 'referral_joined';
          } | null;
          console.log('[ReferralTrace] claimPending:response', {
            targetUid,
            status: res.status,
            ok: Boolean(payload?.ok),
            applied: Boolean(payload?.applied),
            alreadyApplied: Boolean(payload?.alreadyApplied),
            reason: payload?.reason || null,
            referrerUid: payload?.referrerUid || null,
            botDmSent: Boolean(payload?.botDmSent),
            botDmEvent: payload?.botDmEvent || null,
          });
          if (!cancelled && payload?.ok && activePlayerIdRef.current === targetUid) {
            if (payload.applied || payload.alreadyApplied) {
              claimPendingAttemptsRef.current.resolved = true;
              const bonus = Number(payload.referredBonusCoins ?? 100);
              const serverNextCoins = Number(payload.nextReferredCoins);
              const isActivatedNow = Boolean(payload.activated ?? payload.referralActivated);
              setProfile((prev) => {
                if (prev.uid !== targetUid || (prev.referredBy && prev.referralActivated === (prev.referralActivated || isActivatedNow))) return prev;
                const next: UserFarmProfile = {
                  ...prev,
                  referredBy: payload.referrerUid || prev.referredBy,
                  referralActivated: prev.referralActivated || isActivatedNow,
                  coins: Number.isFinite(serverNextCoins)
                    ? serverNextCoins
                    : payload.applied
                      ? prev.coins + bonus
                      : prev.coins,
                };
                latestProfileRef.current = next;
                saveCachedPlayerProfile(next);
                return next;
              });
              if (payload.applied) {
                if (!payload.botDmSent && payload.referrerUid) {
                  void safeFetchJson('/api/referrals/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: isActivatedNow ? 'referral_joined' : 'referral_pending',
                      referrerUid: payload.referrerUid,
                      referredUid: targetUid,
                      referredName: latest.displayName,
                      referredHandle: latest.handle,
                      rewardCoins: economyConfigRef.current.perReferRewardCoins,
                      initData: getTelegramInitData(),
                      token: playerSessionTokenRef.current,
                    }),
                  });
                }
                triggerRewardConfetti();
                playClaimSound(soundsEnabledRef.current);
                triggerHapticFeedback('success');
                showToast(
                  `🎉 Joined via ${payload.referrerName || 'a friend'}! +${bonus}c bonus unlocked.`,
                );
              }
              return;
            }
            if (payload.reason === 'already_linked') {
              claimPendingAttemptsRef.current.resolved = true;
              return;
            }
          }
        }
      } catch (err) {
        console.warn('[ReferralTrace] claimPending:error', {
          targetUid,
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        inFlight = false;
      }

      if (!cancelled && !claimPendingAttemptsRef.current.resolved && claimPendingAttemptsRef.current.count < 4) {
        if (retryTimer !== null) window.clearTimeout(retryTimer);
        retryTimer = window.setTimeout(() => {
          void attemptClaimPending();
        }, 2500);
      }
    };

    const handleResumeCheck = () => {
      if (document.visibilityState !== 'hidden') {
        void attemptClaimPending();
      }
    };

    window.addEventListener('focus', handleResumeCheck);
    document.addEventListener('visibilitychange', handleResumeCheck);
    void attemptClaimPending();

    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      window.removeEventListener('focus', handleResumeCheck);
      document.removeEventListener('visibilitychange', handleResumeCheck);
    };
  }, [activePlayerId, isBanned, isOnline, isPlayerSynced, pendingRefCode, profile.referredBy, referralRetryNonce, showToast]);

  // Sync server /api/referral/stats & /api/referrals storage alongside Firestore referrals so Friends tab stays complete
  useEffect(() => {
    if (!activePlayerId || isBanned || !isOnline) return;
    let cancelled = false;
    const fetchServerReferrals = async () => {
      try {
        const mergedIds = new Set<string>();
        let detectedReferrer: string | null = null;
        const tgInitData = getTelegramInitData();

        if (tgInitData || playerSessionTokenRef.current) {
          const headers: Record<string, string> = {};
          if (tgInitData) headers['x-telegram-init-data'] = tgInitData;
          if (playerSessionTokenRef.current) {
            headers.Authorization = `Bearer ${playerSessionTokenRef.current}`;
          }
          const statsRes = await fetch(resolveApiUrl('/api/referral/stats'), {
            cache: 'no-store',
            headers,
          }).catch(() => null);
          if (statsRes && statsRes.ok && !cancelled) {
            const statsPayload = (await statsRes.json().catch(() => null)) as {
              ok?: boolean;
              invitedBy?: string | null;
              referrals?: Array<{ id?: string; uid?: string }>;
            } | null;
            if (statsPayload?.ok) {
              if (statsPayload.invitedBy) detectedReferrer = statsPayload.invitedBy;
              if (Array.isArray(statsPayload.referrals)) {
                for (const item of statsPayload.referrals) {
                  const rid = String(item?.id || item?.uid || '').trim();
                  if (rid) mergedIds.add(rid);
                }
              }
            }
          }
        }

        const res = await fetch(
          resolveApiUrl(`/api/referrals?userId=${encodeURIComponent(activePlayerId)}`),
          { cache: 'no-store' },
        );
        if (res.ok && !cancelled) {
          const payload = (await res.json().catch(() => null)) as {
            referrals?: unknown;
            referrer?: string | null;
          } | null;
          if (payload) {
            if (Array.isArray(payload.referrals)) {
              for (const id of payload.referrals) {
                const rid = String(id || '').trim();
                if (rid) mergedIds.add(rid);
              }
            }
            if (!detectedReferrer && payload.referrer) {
              detectedReferrer = payload.referrer;
            }
          }
        }

        if (cancelled) return;
        console.log('[ReferralTrace] serverReferrals:synced', {
          activePlayerId,
          mergedReferralCount: mergedIds.size,
          detectedReferrer,
        });
        if (mergedIds.size > 0) {
          setServerReferralIds(Array.from(mergedIds));
        }
        if (detectedReferrer && !latestProfileRef.current.referredBy) {
          try {
            localStorage.setItem(
              `alphagram_referral_verified_v1_${activePlayerId}`,
              JSON.stringify({
                status: 'verified',
                referrerId: detectedReferrer,
                verifiedAtMs: Date.now(),
              }),
            );
          } catch {
            // ignore storage errors
          }
        }
      } catch (err) {
        console.warn('[ReferralTrace] serverReferrals:error', {
          activePlayerId,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    };
    void fetchServerReferrals();
    return () => {
      cancelled = true;
    };
  }, [activePlayerId, activeTab, isBanned, isOnline, isPlayerSynced, referralRetryNonce, referrals.length]);

  const persistMutation = useCallback(
    async (params: {
      nextProfile: UserFarmProfile;
      transaction?: TransactionEntry;
      deposit?: DepositOrder;
      withdrawal?: WithdrawalOrder;
      referrerCommissionCoins?: number;
      activateReferral?: boolean;
    }): Promise<boolean> => {
      if (isBannedRef.current) {
        showToast('Account blocked — actions are disabled.');
        return false;
      }
      if (!params.deposit) {
        latestProfileRef.current = params.nextProfile;
        setProfile(params.nextProfile);
        if (params.transaction) {
          setTransactions((prev) => [params.transaction!, ...prev].slice(0, 60));
        }
        if (params.withdrawal) {
          setWithdrawals((prev) => [params.withdrawal!, ...prev].slice(0, 40));
        }
      }

      try {
        await ensurePromiseRef.current;
        const applied = await commitPlayerMutation({
          profile: params.nextProfile,
          transaction: params.transaction,
          deposit: params.deposit,
          withdrawal: params.withdrawal,
          referrerCommissionCoins: params.referrerCommissionCoins,
          activateReferral: params.activateReferral,
          perReferRewardCoins: economyConfigRef.current.perReferRewardCoins,
        });
        if (params.deposit && applied) {
          latestProfileRef.current = params.nextProfile;
          setProfile(params.nextProfile);
          if (params.transaction) {
            setTransactions((prev) => [params.transaction!, ...prev].slice(0, 60));
          }
          setDeposits((prev) => [params.deposit!, ...prev].slice(0, 40));
        }
        return applied;
      } catch (err) {
        showToast(formatSyncErrorMessage(err, 'Database sync failed — please check connection'));
        return false;
      }
    },
    [showToast],
  );

  const executeClaimPromo = useCallback(
    (code: string, countCompletedAd = false) => {
      const now = Date.now();
      const current = latestProfileRef.current;
      const res = claimPromoCode(current, code, now, promoCodes);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      const nextProfile = countCompletedAd ? recordCompletedGateAd(res.profile) : res.profile;
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerRewardConfetti();
      void persistMutation({
        nextProfile,
        transaction: res.transaction,
      });
      if (res.dynamicPromoCode) {
        void incrementPromoCodeUseInFirestore(res.dynamicPromoCode).catch(() => {});
      }
      showToast(`Gift claimed: ${res.rewardSummary} (${res.label})!`);
    },
    [persistMutation, promoCodes, showToast, soundsEnabled],
  );

  const handleCheckChannels = useCallback(
    async (opts?: {
      silent?: boolean;
      forceRefresh?: boolean;
    }): Promise<ChannelVerificationResult | null> => {
      if (!channelsGateEnabled) {
        const disabledResult: ChannelVerificationResult = {
          ok: true,
          allJoined: true,
          verificationMode: 'disabled',
          telegramUserId: null,
          channels: [],
          checkedAtMs: Date.now(),
        };
        setChannelCheckError(null);
        setChannelVerification(disabledResult);
        channelVerificationRef.current = disabledResult;
        setShowChannelGateModal(false);
        const pendingCode = pendingPromoClaimCodeRef.current;
        if (pendingCode) {
          pendingPromoClaimCodeRef.current = null;
          setPendingPromoClaimCode(null);
          executeClaimPromo(pendingCode, false);
        }
        return disabledResult;
      }

      if (opts?.forceRefresh) {
        channelVerificationRef.current = null;
        setChannelVerification(null);
        try {
          const uidA = latestProfileRef.current.uid;
          const uidB = activePlayerIdRef.current;
          if (uidA) localStorage.removeItem(`chickenland_channels_verified_v1_${uidA}`);
          if (uidB && uidB !== uidA) {
            localStorage.removeItem(`chickenland_channels_verified_v1_${uidB}`);
          }
        } catch {
          // ignore storage errors
        }
      }

      setCheckingChannels(true);
      setChannelCheckError(null);
      try {
        const effectiveUid = latestProfileRef.current.uid || activePlayerIdRef.current;
        const initData = getTelegramInitData();
        const sessionToken = playerSessionTokenRef.current;
        const { response: res, isJson } = await fetchApiWithFallback('/api/telegram/check-channels', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...(initData ? { 'x-telegram-init-data': initData } : {}),
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
          body: JSON.stringify({
            playerId: effectiveUid,
            initData,
            token: sessionToken,
            requiredChannels: activeRequiredChannels,
            forceRefresh: Boolean(opts?.forceRefresh),
            _ts: Date.now(),
          }),
        });
        const rawPayload = (
          isJson ? await res.json().catch(() => null) : null
        ) as (ChannelVerificationResult & { error?: string }) | null;

        let data: ChannelVerificationResult | null = null;
        const isMissingApi = !isJson || res.status === 404 || res.status === 405;

        if (isMissingApi) {
          const tgNumericId = extractTelegramNumericUserId(effectiveUid);
          const localBot = getLocalAdminBotConfig();
          if (tgNumericId && localBot?.token) {
            const directChecks = await Promise.all(
              activeRequiredChannels.map(async (ch) => {
                const chatTarget = /^-?\d+$/.test((ch.chatId || ch.handle).trim())
                  ? (ch.chatId || ch.handle).trim()
                  : `@${ch.handle.trim().replace(/^@+/, '')}`;
                try {
                  const uRes = await fetch(
                    `https://api.telegram.org/bot${localBot.token}/getChatMember?chat_id=${encodeURIComponent(chatTarget)}&user_id=${encodeURIComponent(tgNumericId)}`,
                    { cache: 'no-store' },
                  );
                  const uData = (await uRes.json().catch(() => ({}))) as {
                    ok?: boolean;
                    description?: string;
                    result?: { status?: string; is_member?: boolean };
                  };
                  const st = String(uData.result?.status || 'left');
                  const joined =
                    Boolean(uData.ok) &&
                    (st === 'creator' ||
                      st === 'administrator' ||
                      st === 'member' ||
                      (st === 'restricted' && uData.result?.is_member === true));
                  return {
                    ...ch,
                    joined,
                    status: uData.ok ? st : 'api_error',
                    ...(!uData.ok && uData.description ? { error: uData.description } : {}),
                  };
                } catch {
                  return { ...ch, joined: false, status: 'network_error' };
                }
              }),
            );
            data = {
              ok: true,
              allJoined: directChecks.every((c) => c.joined),
              verificationMode: 'telegram_bot',
              telegramUserId: tgNumericId,
              channels: directChecks,
              checkedAtMs: Date.now(),
            };
          } else {
            const nowMs = Date.now();
            const previewMode: ChannelVerificationResult['verificationMode'] = !tgNumericId
              ? 'guest_browser'
              : 'static_preview';
            data = {
              ok: true,
              allJoined: false,
              verificationMode: previewMode,
              telegramUserId: tgNumericId,
              channels: activeRequiredChannels.map((ch) => ({
                ...ch,
                joined: false,
                status: previewMode === 'guest_browser' ? 'no_telegram_user' : 'static_preview',
              })),
              checkedAtMs: nowMs,
            };
          }
        } else if (!res.ok || !rawPayload) {
          const errMsg =
            rawPayload?.error || `Membership check failed (HTTP ${res.status}). Tap Retry.`;
          setChannelCheckError(errMsg);
          if (!opts?.silent) {
            showToast(errMsg);
          }
          return null;
        } else {
          data = rawPayload;
        }

        setChannelVerification(data);
        channelVerificationRef.current = data;

        if (data.verificationMode === 'disabled') {
          setShowChannelGateModal(false);
          const pendingCode = pendingPromoClaimCodeRef.current;
          if (pendingCode) {
            pendingPromoClaimCodeRef.current = null;
            setPendingPromoClaimCode(null);
            executeClaimPromo(pendingCode, false);
          }
          return data;
        }

        if (data.verificationMode === 'telegram_bot') {
          if (data.allJoined) {
            try {
              localStorage.setItem(
                `chickenland_channels_verified_v1_${latestProfileRef.current.uid}`,
                JSON.stringify(data),
              );
            } catch {
              // ignore storage errors
            }
            setShowChannelGateModal(false);
            const pendingCode = pendingPromoClaimCodeRef.current;
            if (pendingCode) {
              pendingPromoClaimCodeRef.current = null;
              setPendingPromoClaimCode(null);
              executeClaimPromo(pendingCode, false);
            } else if (!opts?.silent) {
              playClaimSound(soundsEnabled);
              triggerHapticFeedback('success');
              showToast(`Verified! Joined ${formatChannelsHandleSummary(activeRequiredChannels)}.`);
            }
          } else {
            try {
              localStorage.removeItem(
                `chickenland_channels_verified_v1_${latestProfileRef.current.uid}`,
              );
            } catch {
              // ignore storage errors
            }
            const apiErrorCh = data.channels.find(
              (c) => !c.joined && (c.status === 'api_error' || c.status === 'network_error') && c.error,
            );
            if (apiErrorCh) {
              setChannelCheckError(`${apiErrorCh.handle}: ${apiErrorCh.error}`);
            }
            const missing = data.channels
              .filter((c) => !c.joined)
              .map((c) => c.handle)
              .join(' & ');
            if (!opts?.silent) {
              triggerHapticFeedback('warning');
              if (apiErrorCh) {
                showToast(`${apiErrorCh.handle}: ${apiErrorCh.error}`);
              } else {
                showToast(`Join required: ${missing || formatChannelsHandleSummary(activeRequiredChannels)}`);
              }
            }
          }
        } else if (!opts?.silent) {
          if (data.verificationMode === 'guest_browser') {
            triggerHapticFeedback('warning');
            showToast('Open this Mini App inside your Telegram Bot to verify your membership.');
          } else if (data.verificationMode === 'static_preview') {
            showToast('Static preview host: open via Bot server or add Bot Token in Admin Panel.');
          } else {
            showToast('Bot verification pending TELEGRAM_BOT_TOKEN on server.');
          }
        }

        return data;
      } catch {
        const netErr = 'Network error while checking Telegram channels. Tap Retry.';
        setChannelCheckError(netErr);
        if (!opts?.silent) {
          showToast(netErr);
        }
        return null;
      } finally {
        setCheckingChannels(false);
      }
    },
    [activeRequiredChannels, channelsGateEnabled, executeClaimPromo, showToast, soundsEnabled],
  );

  const verifiedChannelTaskProofRef = useRef<Record<string, number>>({});

  const clearMembershipCache = useCallback(() => {
    const uidA = latestProfileRef.current.uid;
    const uidB = activePlayerIdRef.current;
    verifiedChannelTaskProofRef.current = {};
    channelVerificationRef.current = null;
    setChannelVerification(null);
    setChannelCheckError(null);
    try {
      if (uidA) localStorage.removeItem(`chickenland_channels_verified_v1_${uidA}`);
      if (uidB && uidB !== uidA) {
        localStorage.removeItem(`chickenland_channels_verified_v1_${uidB}`);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const ensureMustJoinVerified = useCallback(
    async (actionLabel?: string): Promise<boolean> => {
      if (!mustJoinGateEnabledRef.current) {
        return true;
      }
      if (
        isChannelVerificationSatisfied(
          channelVerificationRef.current,
          channelsConfigRef.current,
        )
      ) {
        return true;
      }
      const liveResult = await handleCheckChannels({ silent: true, forceRefresh: true });
      if (isChannelVerificationSatisfied(liveResult, channelsConfigRef.current)) {
        return true;
      }
      pendingPromoClaimCodeRef.current = null;
      setPendingPromoClaimCode(null);
      setShowChannelGateModal(true);
      triggerHapticFeedback('warning');
      const handles = formatChannelsHandleSummary(activeRequiredChannelsRef.current);
      showToast(
        actionLabel
          ? `Join ${handles} first to ${actionLabel}.`
          : `Join all required channels (${handles}) before playing.`,
      );
      return false;
    },
    [handleCheckChannels, showToast],
  );

  const handleVerifyTaskChannel = useCallback(
    async (
      actionUrl: string,
      options?: {
        requireChannelCheck?: boolean;
        channelCheckMode?: TaskChannelCheckMode;
        taskId?: string;
      },
    ): Promise<{ joined: boolean; handle?: string; status?: string; reason?: string }> => {
      const mode: TaskChannelCheckMode =
        options?.channelCheckMode ??
        (options?.requireChannelCheck === false ? 'none' : 'strict');
      if (mode === 'none') {
        return { joined: true };
      }
      const trimmedUrl = String(actionUrl || '').trim();
      if (!trimmedUrl) {
        const reason = 'No Telegram channel link configured for verification.';
        triggerHapticFeedback('warning');
        showToast(reason);
        return { joined: false, status: 'unverifiable_channel', reason };
      }
      if (/[?&]start(app)?=/i.test(trimmedUrl)) {
        const reason = 'Bot ?start= links cannot verify channel membership. Use a t.me/Channel link.';
        triggerHapticFeedback('warning');
        showToast(reason);
        return { joined: false, status: 'unverifiable_channel', reason };
      }
      const isInviteUrl = /t\.me\/(\+|joinchat\/)/i.test(trimmedUrl);
      const normalized = normalizeTelegramChannelHandle(trimmedUrl);
      if (!normalized.handle && !isInviteUrl) {
        const reason = 'Channel handle could not be resolved for verification.';
        triggerHapticFeedback('warning');
        showToast(reason);
        return { joined: false, status: 'unverifiable_channel', reason };
      }
      const displayHandle = normalized.handle || 'this channel';
      const numericUserId = extractTelegramNumericUserId(latestProfileRef.current.uid);
      if (!numericUserId) {
        const reason = `Open in Telegram and join ${displayHandle} first, then tap Join and Claim.`;
        triggerHapticFeedback('warning');
        showToast(reason);
        return { joined: false, handle: displayHandle, status: 'no_telegram_user', reason };
      }
      try {
        const initData = getTelegramInitData();
        const sessionToken = playerSessionTokenRef.current;
        const { response: res, isJson } = await fetchApiWithFallback('/api/telegram/check-task-channel', {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...(initData ? { 'x-telegram-init-data': initData } : {}),
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
          body: JSON.stringify({
            playerId: latestProfileRef.current.uid,
            initData,
            token: sessionToken,
            actionUrl: trimmedUrl,
            requireChannelCheck: true,
            _ts: Date.now(),
          }),
        });
        const data = (
          isJson ? await res.json().catch(() => null) : null
        ) as {
          ok?: boolean;
          enforced?: boolean;
          joined?: boolean;
          handle?: string;
          status?: string;
          reason?: string;
        } | null;

        const isMissingApi = !isJson || res.status === 404 || res.status === 405;
        if (isMissingApi) {
          const localBot = getLocalAdminBotConfig();
          if (localBot?.token && normalized.handle) {
            const chatTarget = `@${normalized.handle.trim().replace(/^@+/, '')}`;
            try {
              const tgRes = await fetch(
                `https://api.telegram.org/bot${localBot.token}/getChatMember?chat_id=${encodeURIComponent(chatTarget)}&user_id=${encodeURIComponent(numericUserId)}`,
                { cache: 'no-store' },
              );
              const tgData = (await tgRes.json().catch(() => ({}))) as {
                ok?: boolean;
                description?: string;
                result?: { status?: string; is_member?: boolean };
              };
              const st = String(tgData.result?.status || 'left');
              const joined =
                Boolean(tgData.ok) &&
                (st === 'creator' ||
                  st === 'administrator' ||
                  st === 'member' ||
                  (st === 'restricted' && tgData.result?.is_member === true));
              if (joined) {
                if (options?.taskId) {
                  verifiedChannelTaskProofRef.current[options.taskId] = Date.now();
                }
                return { joined: true, handle: displayHandle, status: st };
              }
              if (options?.taskId) delete verifiedChannelTaskProofRef.current[options.taskId];
              const directReason = !tgData.ok
                ? tgData.description || `Could not verify ${displayHandle} — make sure the bot is an admin in the channel.`
                : `Not joined ${displayHandle} yet — tap Join, then Claim.`;
              triggerHapticFeedback('warning');
              showToast(directReason);
              return { joined: false, handle: displayHandle, status: tgData.ok ? st : 'api_error', reason: directReason };
            } catch {
              // Fall through to unavailable notice below
            }
          }
          if (options?.taskId) delete verifiedChannelTaskProofRef.current[options.taskId];
          const reason =
            'Live verification server unreachable on this preview URL. Open from your Bot Mini App server or set Backend Server URL in Admin Panel.';
          triggerHapticFeedback('warning');
          showToast(reason);
          return {
            joined: false,
            handle: displayHandle,
            status: 'api_error',
            reason,
          };
        }

        if (data?.status === 'bot_unconfigured') {
          if (options?.taskId) delete verifiedChannelTaskProofRef.current[options.taskId];
          const reason = data?.reason || 'Backend Bot verification is unavailable right now.';
          triggerHapticFeedback('warning');
          showToast(reason);
          return {
            joined: false,
            handle: displayHandle,
            status: 'bot_unconfigured',
            reason,
          };
        }

        if (!res.ok || !data?.ok) {
          if (options?.taskId) delete verifiedChannelTaskProofRef.current[options.taskId];
          const reason =
            data?.reason || `Could not confirm ${displayHandle} join — tap Join, then Claim.`;
          triggerHapticFeedback('warning');
          showToast(reason);
          return { joined: false, handle: displayHandle, status: 'api_error', reason };
        }
        if (data.joined && data.enforced !== false) {
          if (options?.taskId) {
            verifiedChannelTaskProofRef.current[options.taskId] = Date.now();
          }
          return { joined: true, handle: data.handle || displayHandle, status: data.status };
        }
        if (options?.taskId) delete verifiedChannelTaskProofRef.current[options.taskId];
        const handleLabel = data.handle || displayHandle;
        const reason =
          data.reason || `Not joined ${handleLabel} yet — tap Join, then Claim.`;
        triggerHapticFeedback('warning');
        showToast(reason);
        return {
          joined: false,
          handle: handleLabel,
          status: data.status || 'unverified',
          reason,
        };
      } catch {
        if (options?.taskId) delete verifiedChannelTaskProofRef.current[options.taskId];
        const netReason = `Unable to verify ${displayHandle} right now — tap Join, then Claim!`;
        triggerHapticFeedback('warning');
        showToast(netReason);
        return { joined: false, handle: displayHandle, status: 'network_error', reason: netReason };
      }
    },
    [showToast],
  );

  const runClaimedChannelLeaveAudit = useCallback(
    async (force = false): Promise<void> => {
      if (isBannedRef.current) return;
      const current = latestProfileRef.current;
      const numericUserId = extractTelegramNumericUserId(current.uid);
      if (!numericUserId) return;

      const verifiable = getVerifiableClaimedChannelTasks(
        current.completedTaskIds,
        customTasks,
        liveTaskChannelLinksRef.current,
      );
      if (verifiable.length === 0) return;

      const now = Date.now();
      if (!force && now - channelLeaveAuditRef.current < 45_000) return;
      channelLeaveAuditRef.current = now;

      let leftTaskIds: string[] = [];
      try {
        const res = await fetch(resolveApiUrl('/api/telegram/audit-claimed-channels'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: current.uid,
            initData: getTelegramInitData(),
            token: playerSessionTokenRef.current,
            claimedTasks: verifiable.map((v) => ({
              taskId: v.task.id,
              handle: v.handle,
              actionUrl: v.task.actionUrl || '',
            })),
          }),
        });
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('application/json') && res.ok) {
          const data = (await res.json().catch(() => null)) as {
            ok?: boolean;
            leftTaskIds?: string[];
          } | null;
          if (data?.ok && Array.isArray(data.leftTaskIds)) {
            leftTaskIds = data.leftTaskIds;
          }
        }
      } catch {
        return;
      }

      if (leftTaskIds.length === 0) return;
      const latest = latestProfileRef.current;
      const penaltyRes = applyLeftChannelPenalties(
        latest,
        leftTaskIds,
        Date.now(),
        customTasks,
        liveTaskChannelLinksRef.current,
      );
      if (!penaltyRes) return;

      triggerHapticFeedback('warning');
      await persistMutation({
        nextProfile: penaltyRes.profile,
        transaction: penaltyRes.transaction,
      });
      setChannelVerification(null);
      try {
        localStorage.removeItem(`chickenland_channels_verified_v1_${latest.uid}`);
      } catch {
        // ignore storage errors
      }
      const names = penaltyRes.penalizedTasks.map((t) => t.title).slice(0, 2).join(', ');
      showToast(
        `Left channel penalty: -${penaltyRes.totalPenaltyCoins.toLocaleString()} coins (5× deduct) for ${names}.`,
      );
    },
    [customTasks, persistMutation, showToast],
  );

  useEffect(() => {
    if (!isPlayerSynced || isBanned) return;
    if (activeTab === 'tasks' || subView === 'withdraw' || channelLeaveAuditRef.current === 0) {
      void runClaimedChannelLeaveAudit(false);
    }
  }, [activeTab, isBanned, isPlayerSynced, runClaimedChannelLeaveAudit, subView]);

  useEffect(() => {
    if (!channelsGateEnabled) {
      setShowChannelGateModal(false);
      const pendingCode = pendingPromoClaimCodeRef.current;
      if (pendingCode) {
        pendingPromoClaimCodeRef.current = null;
        setPendingPromoClaimCode(null);
        executeClaimPromo(pendingCode, false);
      }
      return;
    }

    // Invalidate stale cached verification if required channels changed
    const currentVerification = channelVerificationRef.current;
    if (
      currentVerification &&
      currentVerification.verificationMode === 'telegram_bot' &&
      !isChannelVerificationSatisfied(currentVerification, channelsConfigRef.current)
    ) {
      clearMembershipCache();
    }
  }, [activeChannelsSignature, channelsGateEnabled, clearMembershipCache, executeClaimPromo]);

  // Live-sync required Telegram channels when returning from Telegram or opening gate/withdraw/must-join views
  useEffect(() => {
    if (!channelsGateEnabled || isBanned || !isPlayerSynced) return;
    const shouldAutoVerifyNow =
      showChannelGateModal ||
      subView === 'withdraw' ||
      (mustJoinGateEnabled &&
        subView !== 'admin' &&
        !isChannelVerificationSatisfied(channelVerificationRef.current, channelsConfigRef.current));
    if (shouldAutoVerifyNow) {
      const now = Date.now();
      if (now - lastAutoChannelCheckAtRef.current >= 2500) {
        lastAutoChannelCheckAtRef.current = now;
        void handleCheckChannels({ silent: true });
      }
    }
    const triggerLiveChannelSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const shouldSyncOnFocus =
        showChannelGateModal ||
        subView === 'withdraw' ||
        (mustJoinGateEnabled &&
          subView !== 'admin' &&
          !isChannelVerificationSatisfied(channelVerificationRef.current, channelsConfigRef.current));
      if (!shouldSyncOnFocus) return;
      const now = Date.now();
      if (now - lastAutoChannelCheckAtRef.current < 2000) return;
      lastAutoChannelCheckAtRef.current = now;
      void handleCheckChannels({ silent: true });
    };
    return subscribeTelegramAppActivated(triggerLiveChannelSync);
  }, [
    channelsGateEnabled,
    handleCheckChannels,
    isBanned,
    isPlayerSynced,
    mustJoinGateEnabled,
    showChannelGateModal,
    subView,
  ]);

  const pendingEggs = useMemo(
    () => calculatePendingEggs(profile, nowMs),
    [profile, nowMs],
  );

  const mergedReferralTransactions = useMemo(() => {
    const byId = new Map<string, TransactionEntry>();
    for (const tx of transactions) {
      byId.set(tx.id, tx);
    }
    for (const tx of referralTransactions) {
      byId.set(tx.id, tx);
    }
    return Array.from(byId.values());
  }, [referralTransactions, transactions]);

  const mergedReferrals = useMemo(() => {
    const byUid = new Map<string, ReferralRecord>();
    for (const r of referrals) {
      const key = (r.referredUid || r.id || '').replace(/^tg_/, '');
      if (key) byUid.set(key, r);
    }
    for (const rawId of serverReferralIds) {
      const cleanId = rawId.trim();
      const normKey = cleanId.replace(/^tg_/, '');
      if (!cleanId || byUid.has(normKey)) continue;
      byUid.set(normKey, {
        id: cleanId,
        referrerUid: profile.uid,
        referredUid: cleanId,
        referredName: `Farmer ${normKey.slice(-4).toUpperCase()}`,
        referredHandle: /^\d{4,20}$/.test(normKey) ? `@tg_${normKey}` : `@${normKey.slice(0, 16)}`,
        status: 'pending',
        coinsEarned: 0,
        toppedUpUsd: 0,
        createdAtMs: Date.now(),
      });
    }
    return Array.from(byUid.values());
  }, [profile.uid, referrals, serverReferralIds]);

  const todayStr = getTodayDateString();
  const hasClaimableTasks =
    profile.lastDailyClaimDate !== todayStr ||
    (profile.lastReinvestDate === todayStr && !profile.completedTaskIds.includes('daily_reinvest'));
  const strings = t(profile.language);

  const executeCollectEggs = useCallback(
    (countCompletedAd = false) => {
      const now = Date.now();
      const current = latestProfileRef.current;
      const pending = calculatePendingEggs(current, now);
      const res = collectEggs(current, now, pending);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      const nextProfile = countCompletedAd ? recordCompletedGateAd(res.profile) : res.profile;
      playEggCollectSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerCollectConfetti();
      setShowWelcomeModal(false);
      setNowMs(now);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('alphagram:eggs-collected', {
            detail: { amount: res.collected },
          }),
        );
      }
      void persistMutation({
        nextProfile,
        transaction: res.transaction,
      });
      showToast(`+${res.collected.toLocaleString()} eggs collected`);
    },
    [persistMutation, showToast, soundsEnabled],
  );

  const handleCollectEggs = () => {
    if (watchingAdLoading) return;
    void (async () => {
      if (!(await ensureMustJoinVerified('collect eggs'))) return;
      const now = Date.now();
      const current = latestProfileRef.current;
      const pending = calculatePendingEggs(current, now);
      const precheck = collectEggs(current, now, pending);
      if ('error' in precheck) {
        showToast(precheck.error);
        return;
      }

      setWatchingAdLoading(true);
      setActiveAdNetwork(null);
      try {
        const external = await tryRunExternalRewardedAd(adConfig);
        if (external.handled) {
          if (external.rewarded) {
            executeCollectEggs(true);
          } else {
            showToast('Complete the ad to collect your eggs.');
          }
          return;
        }
        setAdModalState({
          open: true,
          kind: 'collect_eggs',
          pendingEggs: pending,
          notice: external.message ?? null,
          network: null,
          mandatory: false,
        });
      } finally {
        setWatchingAdLoading(false);
      }
    })();
  };

  const executeBuyChickens = useCallback(
    async (breed: ChickenBreedId, qty: number, countCompletedAd = false) => {
      const current = latestProfileRef.current;
      const now = Date.now();
      const res = buyChickens(current, breed, qty, now);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      const nextProfile = countCompletedAd ? recordCompletedGateAd(res.profile) : res.profile;
      playCoinChimeSound(soundsEnabled);
      triggerHapticFeedback('medium');
      triggerRewardConfetti();
      await persistMutation({
        nextProfile,
        transaction: res.transaction,
        activateReferral: res.shouldActivateReferral,
      });
      if (res.shouldActivateReferral && current.referredBy) {
        void (async () => {
          const actRes = await safeFetchJson<{ ok?: boolean; botDmSent?: boolean }>('/api/referrals/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referredUid: nextProfile.uid,
              referrerUid: current.referredBy,
              referredName: nextProfile.displayName,
              referredHandle: nextProfile.handle,
              initData: getTelegramInitData(),
              token: playerSessionTokenRef.current,
            }),
          });
          if (!actRes?.botDmSent) {
            await safeFetchJson('/api/referrals/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'referral_joined',
                referrerUid: current.referredBy,
                referredUid: nextProfile.uid,
                referredName: nextProfile.displayName,
                referredHandle: nextProfile.handle,
                rewardCoins: economyConfigRef.current.perReferRewardCoins,
                initData: getTelegramInitData(),
                token: playerSessionTokenRef.current,
              }),
            });
          }
        })();
        showToast(
          `🎉 Bought ${qty} hen${qty > 1 ? 's' : ''} · +${economyConfigRef.current.perReferRewardCoins.toLocaleString()}c refer bonus unlocked!`,
        );
      } else {
        showToast(`Purchased ${qty} chicken${qty > 1 ? 's' : ''}!`);
      }
    },
    [persistMutation, showToast, soundsEnabled],
  );

  const handleBuyChickens = async (breed: ChickenBreedId, qty: number) => {
    if (watchingAdLoading) return;
    if (!(await ensureMustJoinVerified('buy chickens'))) return;
    await ensurePromiseRef.current;
    const current = latestProfileRef.current;
    const now = Date.now();
    const precheck = buyChickens(current, breed, qty, now);
    if ('error' in precheck) {
      showToast(precheck.error);
      return;
    }

    const pack = CHICKEN_PACKS.find((p) => p.id === breed);
    const costCoins = (pack?.coinCost ?? 0) * qty;

    setWatchingAdLoading(true);
    setActiveAdNetwork(null);
    try {
      const external = await tryRunExternalRewardedAd(adConfig);
      if (external.handled) {
        if (external.rewarded) {
          await executeBuyChickens(breed, qty, true);
        } else {
          showToast('Complete the ad to buy this miner.');
        }
        return;
      }
      setAdModalState({
        open: true,
        kind: 'buy_chicken',
        chickenBreed: breed,
        chickenQty: qty,
        minerCostCoins: costCoins,
        notice: external.message ?? null,
        network: null,
        mandatory: false,
      });
    } finally {
      setWatchingAdLoading(false);
    }
  };

  const handleAutoCreditGramDeposit = useCallback(
    async (transfer: DetectedGramTransfer): Promise<boolean> => {
      const targetNorm = normalizeTxHash(transfer.txHash);
      const alreadyExists = deposits.some((d) => {
        if (!d.txHash) return false;
        return (
          d.txHash.toLowerCase() === transfer.txHash.toLowerCase() ||
          (Boolean(targetNorm) && normalizeTxHash(d.txHash) === targetNorm)
        );
      });
      if (alreadyExists) return false;

      const current = latestProfileRef.current;
      const res = executeDeposit(
        current,
        transfer.coinsToCredit,
        'GRAM_TON',
        transfer.timestampMs || Date.now(),
        transfer.txHash,
        transfer.gramAmount,
        depositAddress,
      );
      if ('error' in res) {
        showToast(res.error);
        return false;
      }
      const applied = await persistMutation({
        nextProfile: res.profile,
        deposit: res.deposit,
        transaction: res.transaction,
        referrerCommissionCoins: res.referrerCommissionCoins,
      });
      if (!applied) return false;
      const effectiveReferrer = res.profile.referredBy || current.referredBy;
      const effectiveCommission =
        res.referrerCommissionCoins > 0
          ? res.referrerCommissionCoins
          : effectiveReferrer
            ? Math.max(1, Math.round(res.deposit.coinsAmount * REFERRAL_DEPOSIT_COMMISSION_RATE))
            : 0;
      if (effectiveCommission > 0 && effectiveReferrer) {
        void safeFetchJson('/api/referrals/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'deposit_commission',
            referrerUid: effectiveReferrer,
            referredUid: current.uid,
            referredName: current.displayName,
            referredHandle: current.handle,
            rewardCoins: effectiveCommission,
            depositGram: res.deposit.cryptoAmount,
            depositUsd: res.deposit.usdAmount,
            initData: getTelegramInitData(),
            token: playerSessionTokenRef.current,
          }),
        });
      }
      playCoinChimeSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerDepositConfetti();
      showToast(`+${res.deposit.coinsAmount.toLocaleString()} coins credited from ${res.deposit.cryptoAmount}!`);
      return true;
    },
    [depositAddress, deposits, persistMutation, showToast, soundsEnabled],
  );

  const executeReinvest = useCallback(
    (eggsAmount: number) => {
      const now = Date.now();
      const res = reinvestEggs(latestProfileRef.current, eggsAmount, now, economyConfigRef.current);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      playCoinChimeSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerRewardConfetti();
      setShowReinvestModal(false);
      void persistMutation({
        nextProfile: res.profile,
        transaction: res.transaction,
      });
      const taskUnlockedNote = !res.profile.completedTaskIds.includes('daily_reinvest')
        ? ' · Reinvest task ready to Claim!'
        : '';
      const bonusNote = res.isSurgeApplied
        ? `+${res.bonusPercent}% Surge`
        : `+${res.bonusPercent}% extra`;
      showToast(
        `Reinvested ${eggsAmount.toLocaleString()} eggs into +${res.coinsReceived.toLocaleString()} coins (${bonusNote})${taskUnlockedNote}`,
      );
    },
    [persistMutation, showToast, soundsEnabled],
  );

  const handleStartReinvestWithAd = useCallback(
    async (eggsAmount: number) => {
      if (watchingAdLoading) return;
      if (!(await ensureMustJoinVerified('reinvest eggs'))) return;
      const now = Date.now();
      const precheck = reinvestEggs(latestProfileRef.current, eggsAmount, now, economyConfigRef.current);
      if ('error' in precheck) {
        showToast(precheck.error);
        return;
      }
      setShowReinvestModal(false);
      setWatchingAdLoading(true);
      setActiveAdNetwork(null);
      try {
        const external = await tryRunExternalRewardedAd(adConfig);
        if (external.handled) {
          if (external.rewarded) {
            executeReinvest(eggsAmount);
          } else {
            showToast('Complete the ad to finish reinvesting.');
          }
          return;
        }
        setAdModalState({
          open: true,
          kind: 'reinvest',
          reinvestEggs: eggsAmount,
          reinvestCoins: precheck.coinsReceived,
          reinvestBonusPercent: precheck.bonusPercent,
          notice: external.message ?? null,
          network: null,
          mandatory: false,
        });
      } finally {
        setWatchingAdLoading(false);
      }
    },
    [adConfig, ensureMustJoinVerified, executeReinvest, showToast, watchingAdLoading],
  );

  const handleConfirmWithdraw = async (eggsAmount: number, walletAddress: string, memo: string) => {
    if (!(await ensureMustJoinVerified('withdraw GRAM'))) {
      return;
    }
    if (
      channelsGateEnabled &&
      activeRequiredChannels.length > 0 &&
      channelVerification?.verificationMode === 'telegram_bot' &&
      !channelVerification.allJoined
    ) {
      showToast('Join all required channels & tap Check Channels first.');
      return;
    }
    await runClaimedChannelLeaveAudit(true);
    const now = Date.now();
    const res = executeWithdrawal(
      latestProfileRef.current,
      eggsAmount,
      walletAddress,
      memo,
      now,
      economyConfigRef.current.minWithdrawEggs,
    );
    if ('error' in res) {
      showToast(res.error);
      return;
    }
    playCoinChimeSound(soundsEnabled);
    triggerHapticFeedback('success');
    await persistMutation({
      nextProfile: res.profile,
      withdrawal: res.withdrawal,
      transaction: res.transaction,
    });
    triggerWithdrawalConfetti();

    await safeFetchJson('/api/withdraw/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        withdrawalId: res.withdrawal.id.replace(/[^a-zA-Z0-9_-]/g, '_'),
        initData: getTelegramInitData(),
        token: playerSessionTokenRef.current,
        displayName: res.profile.displayName,
        handle: res.profile.handle,
        playerId: res.profile.uid,
        eggsAmount: res.withdrawal.eggsAmount,
        gramAmount: res.withdrawal.gramAmount,
        usdValue: res.withdrawal.usdValue,
        walletAddress: res.withdrawal.walletAddress,
        memo: res.withdrawal.memo,
        status: 'pending',
      }),
    });
    const updatedAdGate = getWithdrawAdGateStatus(res.profile);
    showToast(
      `Withdrawal submitted (${res.withdrawal.gramAmount} GRAM) — Pending Admin approval · Ads criteria ${updatedAdGate.watched}/${updatedAdGate.required}`,
    );
  };

  const handleReviewWithdrawal = async (
    request: WithdrawRequestRecord,
    decision: 'approved' | 'rejected',
    adminNote: string,
  ) => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      showToast('Admin passcode verification required before modifying payouts.');
      return;
    }
    const sendWithdrawNotifyDirectPreview = async (): Promise<{
      userDmSent: boolean;
      userDmReason?: string;
    }> => {
      const localBot = getLocalAdminBotConfig();
      const userNumericId = extractTelegramNumericUserId(request.userId);
      if (!localBot) {
        return { userDmSent: false, userDmReason: 'Bot Token not configured on server or browser.' };
      }
      if (!userNumericId) {
        return { userDmSent: false, userDmReason: 'User has no Telegram numeric ID.' };
      }
      try {
        if (payoutChannel) {
          const chTarget = payoutChannel.startsWith('@') || /^-?\d+$/.test(payoutChannel)
            ? payoutChannel
            : `@${payoutChannel}`;
          const miniAppUrl = telegramBotConfig.appShortName
            ? `https://t.me/${telegramBotConfig.botUsername}/${telegramBotConfig.appShortName}`
            : `https://t.me/${telegramBotConfig.botUsername}`;
          let chPayload: Record<string, unknown>;
          if (decision === 'approved') {
            const chRendered = renderPayoutChannelApproveMessage({
              template: withdrawApproveTemplate,
              gramAmount: request.gramAmount,
              eggsAmount: request.eggsAmount,
              walletAddress: request.walletAddress,
              usdValue: request.usdValue,
              displayName: request.displayName,
              txId: request.txId || request.id,
              adminNote,
              miniAppUrl,
            });
            chPayload = {
              chat_id: chTarget,
              text: chRendered.htmlText,
              parse_mode: 'HTML',
              ...(chRendered.inlineButtons.length > 0
                ? { reply_markup: { inline_keyboard: chRendered.inlineButtons } }
                : {}),
            };
          } else {
            const chText = [
              '⚠️ <b>Alpha Gram Payout Rejected</b>',
              '',
              `👤 <b>Farmer:</b> ${request.displayName}`,
              `🥚 <b>Eggs:</b> ${request.eggsAmount.toLocaleString()}`,
              `💎 <b>Amount:</b> ${request.gramAmount} GRAM`,
              `🏦 <b>Wallet:</b> <code>${formatShortTonWallet(request.walletAddress)}</code>`,
              '<b>Status:</b> ❌ Rejected (Eggs Refunded)',
            ].join('\n');
            chPayload = { chat_id: chTarget, text: chText, parse_mode: 'HTML' };
          }
          await fetch(`https://api.telegram.org/bot${localBot.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chPayload),
          }).catch(() => {});
        }

        let dmPayload: Record<string, unknown>;
        let plainTextFallback = '';
        if (decision === 'approved') {
          const rendered = renderWithdrawApproveMessage({
            template: withdrawApproveTemplate,
            gramAmount: request.gramAmount,
            eggsAmount: request.eggsAmount,
            walletAddress: request.walletAddress,
            usdValue: request.usdValue,
            displayName: request.displayName,
            handle: request.handle,
            txId: request.txId || request.id,
            memo: request.memo,
            adminNote,
          });
          plainTextFallback = rendered.plainText;
          dmPayload = {
            chat_id: userNumericId,
            text: rendered.htmlText,
            parse_mode: 'HTML',
            ...(rendered.buttonText && /^https:\/\//i.test(rendered.buttonUrl)
              ? { reply_markup: { inline_keyboard: [[{ text: rendered.buttonText, url: rendered.buttonUrl }]] } }
              : {}),
          };
        } else {
          const miniAppUrl = `https://t.me/${telegramBotConfig.botUsername}/${telegramBotConfig.appShortName}`;
          const rejText = [
            '❌ <b>Withdrawal Rejected</b>',
            '',
            `Your withdrawal request of <b>${request.gramAmount} GRAM</b> could not be processed and <b>${request.eggsAmount.toLocaleString()} Eggs</b> have been refunded to your farm balance.`,
            ...(adminNote ? ['', `💬 <b>Note:</b> ${adminNote}`] : []),
          ].join('\n');
          plainTextFallback = rejText.replace(/<\/?[^>]+>/g, '');
          dmPayload = {
            chat_id: userNumericId,
            text: rejText,
            parse_mode: 'HTML',
            reply_markup: { inline_keyboard: [[{ text: '🐔 Open Alpha Gram', url: miniAppUrl }]] },
          };
        }

        let dmRes = await fetch(`https://api.telegram.org/bot${localBot.token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dmPayload),
        });
        let dmJson = (await dmRes.json().catch(() => ({}))) as {
          ok?: boolean;
          error_code?: number;
          description?: string;
        };
        if (!dmJson.ok && dmJson.error_code === 400) {
          dmRes = await fetch(`https://api.telegram.org/bot${localBot.token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: userNumericId,
              text: plainTextFallback || String(dmPayload.text || '').replace(/<\/?[^>]+>/g, ''),
            }),
          });
          dmJson = (await dmRes.json().catch(() => ({}))) as typeof dmJson;
        }
        return {
          userDmSent: Boolean(dmJson.ok),
          userDmReason: dmJson.ok ? undefined : dmJson.description || 'Telegram API error',
        };
      } catch (err) {
        return {
          userDmSent: false,
          userDmReason: err instanceof Error ? err.message : 'Telegram request failed',
        };
      }
    };

    try {
      await reviewWithdrawalInFirestore({ request, decision, adminNote });

      let userDmSent = false;
      let userDmReason: string | undefined;
      try {
        const res = await fetch(resolveApiUrl('/api/withdraw/notify'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminSessionToken ? { Authorization: `Bearer ${adminSessionToken}` } : {}),
          },
          body: JSON.stringify({
            withdrawalId: request.id,
            txId: request.txId || request.id,
            initData: getTelegramInitData(),
            token: adminSessionToken,
            displayName: request.displayName,
            handle: request.handle,
            playerId: request.userId,
            eggsAmount: request.eggsAmount,
            gramAmount: request.gramAmount,
            usdValue: request.usdValue,
            walletAddress: request.walletAddress,
            memo: request.memo,
            status: decision,
            adminNote,
          }),
        });
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('application/json') || res.status === 404 || res.status === 405) {
          const direct = await sendWithdrawNotifyDirectPreview();
          userDmSent = direct.userDmSent;
          userDmReason = direct.userDmReason;
        } else {
          const payload = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            userDmSent?: boolean;
            userDmReason?: string;
            reason?: string;
          };
          if (res.ok && payload.ok) {
            userDmSent = Boolean(payload.userDmSent);
            userDmReason = payload.userDmReason;
            if (!userDmSent && getLocalAdminBotConfig()) {
              const direct = await sendWithdrawNotifyDirectPreview();
              if (direct.userDmSent) {
                userDmSent = true;
                userDmReason = undefined;
              } else if (direct.userDmReason && !userDmReason) {
                userDmReason = direct.userDmReason;
              }
            }
          } else if (res.status === 403 && getLocalAdminBotConfig()) {
            const direct = await sendWithdrawNotifyDirectPreview();
            userDmSent = direct.userDmSent;
            userDmReason = direct.userDmReason;
          } else {
            userDmReason = payload.userDmReason || payload.reason || `HTTP ${res.status}`;
          }
        }
      } catch {
        const direct = await sendWithdrawNotifyDirectPreview();
        userDmSent = direct.userDmSent;
        userDmReason = direct.userDmReason;
      }

      if (decision === 'approved') {
        showToast(
          userDmSent
            ? `Approved ${request.gramAmount} GRAM & sent DM to ${request.displayName}!`
            : `Approved ${request.gramAmount} GRAM (${userDmReason ? `DM skipped: ${userDmReason}` : 'DM not sent'})`,
        );
      } else {
        showToast(
          userDmSent
            ? `Rejected, refunded ${request.eggsAmount.toLocaleString()} eggs & notified user!`
            : `Rejected & refunded ${request.eggsAmount.toLocaleString()} eggs${userDmReason ? ` (${userDmReason})` : ''}`,
        );
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to review withdrawal.');
    }
  };

  const handleCreateCustomTask = async (input: {
    title: string;
    subtitle?: string;
    category: TaskCategory;
    rewardCoins: number;
    icon: string;
    actionUrl: string;
    totalSlots?: number;
    requireChannelCheck?: boolean;
  }) => {
    try {
      await createCustomTaskInFirestore(input);
      showToast(`Added task "${input.title}"!`);
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to add custom task.'));
    }
  };

  const handleCreatePaidUserTask = async (input: {
    title: string;
    subtitle?: string;
    category: TaskCategory;
    rewardCoins: number;
    icon: string;
    actionUrl: string;
    totalSlots: number;
    requireChannelCheck?: boolean;
  }): Promise<boolean> => {
    if (!(await ensureMustJoinVerified('publish a sponsor task'))) return false;
    await ensurePromiseRef.current;
    const current = latestProfileRef.current;
    const now = Date.now();
    const resolvedPricing = resolveTaskPricingConfig(taskPricingConfig);
    const order = createPaidTaskOrder(current, input, now, resolvedPricing);
    if ('error' in order) {
      showToast(order.error);
      return false;
    }

    const minTotalCostCoins =
      resolvedPricing.minBudgetCoins +
      (input.requireChannelCheck ? resolvedPricing.channelCheckFeeCoins : 0);

    try {
      const committed = await createPaidCustomTaskInFirestore({
        profile: order.profile,
        transaction: order.transaction,
        paidCoins: order.cost.totalCostCoins,
        minTotalCostCoins,
        taskInput: {
          title: input.title,
          subtitle: input.subtitle,
          category: input.category,
          rewardCoins: order.cost.rewardCoins,
          icon: input.icon,
          actionUrl: input.actionUrl,
          totalSlots: order.cost.totalSlots,
          requireChannelCheck: input.requireChannelCheck,
        },
      });
      if ('error' in committed) {
        showToast(committed.error);
        return false;
      }

      latestProfileRef.current = committed.profile;
      setProfile(committed.profile);
      setCustomTasks((prev) => [committed.task, ...prev.filter((t) => t.id !== committed.task.id)]);
      setTransactions((prev) => [order.transaction, ...prev].slice(0, 60));
      playCoinChimeSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast(`Task live in Sponsors! -${order.cost.totalCostCoins.toLocaleString()} coins`);
      return true;
    } catch {
      showToast('Failed to publish paid task.');
      return false;
    }
  };

  const handleRefreshTasks = useCallback(
    async (silent = false): Promise<boolean> => {
      try {
        const items = await fetchCustomTasksFromFirestore();
        setCustomTasks(items);
        if (!silent) {
          verifiedChannelTaskProofRef.current = {};
          void runClaimedChannelLeaveAudit(true);
          playSoftTapSound(soundsEnabled);
          triggerHapticFeedback('light');
          showToast('Task slots & live channels refreshed');
        }
        return true;
      } catch {
        if (!silent) {
          showToast('Could not refresh tasks — please retry');
        }
        return false;
      }
    },
    [runClaimedChannelLeaveAudit, showToast, soundsEnabled],
  );

  const handleTopUpTask = async (taskId: string, budgetCoins: number): Promise<boolean> => {
    if (!(await ensureMustJoinVerified('top up campaign'))) return false;
    await ensurePromiseRef.current;
    const current = latestProfileRef.current;
    const task = customTasks.find((t) => t.id === taskId);
    if (!task) {
      showToast('Campaign task not found.');
      return false;
    }
    const order = createTopUpPaidTaskOrder(current, task, budgetCoins, Date.now());
    if ('error' in order) {
      showToast(order.error);
      return false;
    }
    try {
      const committed = await topUpPaidCustomTaskInFirestore({
        profile: order.profile,
        taskId,
        addedSlots: order.preview.additionalSlots,
        addedPaidCoins: order.preview.totalCostCoins,
        transaction: order.transaction,
      });
      if ('error' in committed) {
        showToast(committed.error);
        return false;
      }
      latestProfileRef.current = committed.profile;
      setProfile(committed.profile);
      setCustomTasks((prev) => prev.map((t) => (t.id === taskId ? committed.task : t)));
      setTransactions((prev) => [order.transaction, ...prev].slice(0, 60));
      playCoinChimeSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast(
        `+${order.preview.additionalSlots} slots added (-${order.preview.totalCostCoins.toLocaleString()} coins)`,
      );
      return true;
    } catch {
      showToast('Failed to top up campaign.');
      return false;
    }
  };

  const handleRefundTask = async (taskId: string): Promise<boolean> => {
    if (!(await ensureMustJoinVerified('refund campaign'))) return false;
    await ensurePromiseRef.current;
    const current = latestProfileRef.current;
    const task = customTasks.find((t) => t.id === taskId);
    if (!task) {
      showToast('Campaign task not found.');
      return false;
    }
    const order = createRefundPaidTaskOrder(current, task, Date.now());
    if ('error' in order) {
      showToast(order.error);
      return false;
    }
    try {
      const committed = await refundPaidCustomTaskInFirestore({
        profile: order.profile,
        taskId,
        transaction: order.transaction,
      });
      if ('error' in committed) {
        showToast(committed.error);
        return false;
      }
      latestProfileRef.current = committed.profile;
      setProfile(committed.profile);
      setCustomTasks((prev) => prev.map((t) => (t.id === taskId ? committed.task : t)));
      setTransactions((prev) => [order.transaction, ...prev].slice(0, 60));
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast(`Refunded +${committed.refundCoins.toLocaleString()} unused coins!`);
      return true;
    } catch {
      showToast('Failed to refund unused campaign slots.');
      return false;
    }
  };

  const handleToggleCustomTask = async (taskId: string, isActive: boolean) => {
    try {
      await toggleCustomTaskInFirestore(taskId, isActive);
      showToast(isActive ? 'Task activated!' : 'Task paused.');
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to update task.'));
    }
  };

  const handleDeleteCustomTask = async (taskId: string) => {
    try {
      await deleteCustomTaskInFirestore(taskId);
      showToast('Task deleted.');
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to delete task.'));
    }
  };

  const handleSaveAdConfig = async (cfg: Omit<AdConfig, 'updatedAtMs'>): Promise<boolean> => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      showToast('Admin passcode verification required.');
      return false;
    }
    try {
      const saved = await saveAdConfigInFirestore(cfg);
      setAdConfig(saved);
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast('Ad settings saved & synced live!');
      return true;
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to save ad settings to database.'));
      return false;
    }
  };

  const handleSaveChannelsConfig = async (
    cfg: Omit<ChannelsConfig, 'updatedAtMs'>,
  ): Promise<boolean> => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      showToast('Admin passcode verification required.');
      return false;
    }
    let saved: ChannelsConfig | null = null;
    let fsErr: unknown = null;
    try {
      saved = await saveChannelsConfigInFirestore(cfg);
    } catch (err) {
      fsErr = err;
    }

    const serverRes = await safeFetchJson<{
      ok?: boolean;
      channelsConfig?: ChannelsConfig;
    }>('/api/admin/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cfg,
        token: adminSessionTokenRef.current,
        initData: getTelegramInitData(),
      }),
    });

    const finalSaved = saved || (serverRes?.ok ? serverRes.channelsConfig || null : null);
    if (finalSaved) {
      setChannelsConfig(finalSaved);
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast('Channel settings saved & synced live!');
      return true;
    }

    showToast(formatSyncErrorMessage(fsErr, 'Failed to save channel settings to database.'));
    return false;
  };

  const handleSyncChannelsWithBot = async (payload?: {
    enabled?: boolean;
    mustJoin?: boolean;
    channels?: RequiredTelegramChannel[];
    getCodeChannelUrl?: string;
  }) => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      return {
        ok: false,
        error: 'Admin passcode verification required to sync channels with Bot.',
      };
    }
    try {
      const response = await fetch(resolveApiUrl('/api/telegram/sync-channels'), {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: adminSessionTokenRef.current,
          initData: getTelegramInitData(),
          enabled: payload?.enabled,
          mustJoin: payload?.mustJoin,
          channels: payload?.channels,
          getCodeChannelUrl: payload?.getCodeChannelUrl,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        botConfigured?: boolean;
        botUsername?: string | null;
        channelsConfig?: ChannelsConfig;
        error?: string;
        results?: Array<{
          id: string;
          handle: string;
          chatId?: string;
          title?: string;
          memberCount?: number | null;
          botIsAdmin: boolean;
          botStatus: string;
          error?: string;
        }>;
      };
      if (typeof data.botConfigured === 'boolean') {
        setServerBotConfigured(data.botConfigured);
      }
      if (response.ok && data.ok && data.channelsConfig) {
        setChannelsConfig(data.channelsConfig);
        void saveChannelsConfigInFirestore({
          enabled: data.channelsConfig.enabled,
          mustJoin: Boolean(data.channelsConfig.mustJoin),
          channels: data.channelsConfig.channels,
          getCodeChannelUrl: data.channelsConfig.getCodeChannelUrl,
        }).catch(() => undefined);
        playClaimSound(soundsEnabled);
        triggerHapticFeedback('success');
        showToast('Channels synced live from Telegram Bot!');
        return {
          ok: true,
          botConfigured: data.botConfigured,
          botUsername: data.botUsername,
          channelsConfig: data.channelsConfig,
          results: data.results,
        };
      }
      if (response.status === 401 || response.status === 403) {
        setAdminUnlocked(false);
        setAdminSessionToken('');
      }
      return {
        ok: false,
        botConfigured: data.botConfigured,
        error: data.error || `Failed to sync channels (HTTP ${response.status}).`,
      };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach server for Telegram Bot channel sync.',
      };
    }
  };

  const handleSaveTaskPricingConfig = async (
    cfg: Omit<TaskPricingConfig, 'updatedAtMs'>,
  ): Promise<boolean> => {
    try {
      const saved = await saveTaskPricingConfigInFirestore(cfg);
      setTaskPricingConfig(saved);
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast('Paid task pricing updated live!');
      return true;
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to save task pricing settings.'));
      return false;
    }
  };

  const handleSaveEconomyConfig = async (
    cfg: Omit<EconomyConfig, 'updatedAtMs'>,
  ): Promise<boolean> => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      showToast('Admin passcode verification required to modify economy & payout limits.');
      return false;
    }
    let saved: EconomyConfig | null = null;
    let fsErr: unknown = null;
    try {
      saved = await saveEconomyConfigInFirestore(cfg);
    } catch (err) {
      fsErr = err;
    }

    const serverRes = await safeFetchJson<{
      ok?: boolean;
      economy?: EconomyConfig;
    }>('/api/admin/economy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cfg,
        token: adminSessionTokenRef.current,
        initData: getTelegramInitData(),
      }),
    });

    const finalSaved = saved || (serverRes?.ok ? serverRes.economy || null : null);
    if (finalSaved) {
      setCachedLiveEconomyConfig(finalSaved);
      setEconomyConfig(finalSaved);
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      const surge = getActiveReinvestSurgeStatus(finalSaved, Date.now());
      const surgeToast = surge.isActive ? ` · Surge +${surge.bonusPercent}% LIVE` : '';
      showToast(
        `Saved! Min Withdraw: ${finalSaved.minWithdrawEggs.toLocaleString()} eggs · Per Refer: +${finalSaved.perReferRewardCoins.toLocaleString()} coins${surgeToast}`,
      );
      return true;
    }

    showToast(formatSyncErrorMessage(fsErr, 'Failed to save economy settings.'));
    return false;
  };

  const handleSaveMaintenanceConfig = async (
    cfg: Omit<MaintenanceConfig, 'updatedAtMs'>,
  ): Promise<MaintenanceConfig | null> => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      showToast('Admin passcode verification required.');
      return null;
    }
    let saved: MaintenanceConfig | null = null;
    let fsErr: unknown = null;
    try {
      saved = await saveMaintenanceConfigInFirestore({
        ...cfg,
        updatedBy: cfg.updatedBy || latestProfileRef.current.uid,
      });
    } catch (err) {
      fsErr = err;
    }

    const serverRes = await safeFetchJson<{
      ok?: boolean;
      maintenance?: MaintenanceConfig;
    }>('/api/admin/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cfg,
        token: adminSessionTokenRef.current,
        initData: getTelegramInitData(),
      }),
    });

    const finalSaved = saved || (serverRes?.ok ? serverRes.maintenance || null : null);
    if (finalSaved) {
      setMaintenanceConfig(finalSaved);
      setMaintenanceLoaded(true);
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast(
        finalSaved.enabled
          ? 'Maintenance Mode enabled — app paused for non-admin users.'
          : 'Maintenance Mode disabled — app is live for all users!',
      );
      return finalSaved;
    }

    showToast(formatSyncErrorMessage(fsErr, 'Failed to save Maintenance Mode settings.'));
    return null;
  };

  const handleExecuteDataReset = async (
    onProgress?: (stage: string) => void,
  ): Promise<{
    ok: boolean;
    error?: string;
    summary?: string;
  }> => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      const msg = 'Admin passcode verification required before executing System Data Reset.';
      showToast(msg);
      return { ok: false, error: msg };
    }
    if (dataResetInFlightRef.current) {
      return { ok: false, error: 'A system data reset is already in progress.' };
    }
    dataResetInFlightRef.current = true;

    const completeResetLocally = (epochMs: number, summary?: string) => {
      setSystemResetConfig((prev) => ({
        resetEpochMs: epochMs,
        resetCount: (prev.resetCount || 0) + 1,
        resetBy: latestProfileRef.current.uid,
        updatedAtMs: epochMs,
      }));
      applyLocalSystemResetForEpoch(epochMs);
      setCustomTasks([]);
      setPromoCodes([]);
      setRecentPlayers([]);
      setLeaderboardEntries([]);
      setSeasonConfig(createDefaultSeasonConfig());
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast('System Data Reset complete — fresh system ready!');
      return { ok: true, summary };
    };

    const runFirestoreResetFallback = async (
      serverReason?: string,
    ): Promise<{
      ok: boolean;
      error?: string;
      summary?: string;
    }> => {
      let fallbackTimerId: number | null = null;
      try {
        onProgress?.(
          serverReason
            ? `${serverReason} — running direct database reset...`
            : 'Running direct database reset...',
        );
        const fb = await Promise.race([
          executeDataResetInFirestore(latestProfileRef.current.uid, onProgress),
          new Promise<never>((_, reject) => {
            fallbackTimerId = window.setTimeout(
              () =>
                reject(
                  new Error('Database reset timed out after 45s. Please check connection and retry.'),
                ),
              45_000,
            );
          }),
        ]);
        return completeResetLocally(fb.resetEpochMs, fb.summary);
      } catch (err) {
        const directMsg = formatSyncErrorMessage(err, 'Failed to execute direct database reset.');
        const combined = serverReason ? `${serverReason} Direct reset failed: ${directMsg}` : directMsg;
        showToast(combined);
        return { ok: false, error: combined };
      } finally {
        if (fallbackTimerId !== null) {
          window.clearTimeout(fallbackTimerId);
        }
      }
    };

    try {
      const tgInitData = getTelegramInitData();
      const sessionToken = adminSessionTokenRef.current;

      onProgress?.('Requesting server Data Reset (up to 30s)...');
      const controller = new AbortController();
      let requestTimedOut = false;
      const requestTimeoutId = window.setTimeout(() => {
        requestTimedOut = true;
        controller.abort();
      }, 30_000);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (sessionToken) {
          headers.Authorization = `Bearer ${sessionToken}`;
        }
        if (tgInitData) {
          headers['x-telegram-init-data'] = tgInitData;
        }
        const res = await fetch(resolveApiUrl('/api/admin/data-reset'), {
          method: 'POST',
          cache: 'no-store',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            token: sessionToken,
            initData: tgInitData,
            confirm: 'RESET',
          }),
        });
        window.clearTimeout(requestTimeoutId);

        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('application/json') || res.status === 404 || res.status === 405) {
          return await runFirestoreResetFallback('Server endpoint unavailable');
        }

        const payload = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          resetEpochMs?: number;
          summary?: string;
          error?: string;
        };

        if (!res.ok || !payload.ok) {
          if (res.status === 400 || res.status === 429) {
            const errMsg = payload.error || `Data Reset rejected (HTTP ${res.status}).`;
            showToast(errMsg);
            return { ok: false, error: errMsg };
          }
          if (res.status === 401 || res.status === 403) {
            setAdminUnlocked(false);
            setAdminSessionToken('');
            const errMsg =
              payload.error || 'Admin verification expired — please unlock Admin Console again.';
            showToast(errMsg);
            return { ok: false, error: errMsg };
          }
          const serverErr = payload.error || `Server error (HTTP ${res.status})`;
          return await runFirestoreResetFallback(serverErr);
        }

        const epochMs = Number(payload.resetEpochMs) || Date.now();
        onProgress?.('Finalizing local farm state...');
        return completeResetLocally(epochMs, payload.summary);
      } catch (err) {
        window.clearTimeout(requestTimeoutId);
        const reason = requestTimedOut
          ? 'Server Data Reset timed out after 30s'
          : err instanceof Error && err.message
            ? `Server request failed (${err.message})`
            : 'Unable to reach live Node server';
        return await runFirestoreResetFallback(reason);
      }
    } finally {
      dataResetInFlightRef.current = false;
    }
  };

  const handleCreatePromoCode = async (input: {
    code: string;
    label: string;
    coins: number;
    rewardType?: PromoRewardType;
    eggs?: number;
    chickenBreed?: ChickenBreedId;
    chickenQty?: number;
    maxUses: number;
    expiresInHours: number;
  }): Promise<DynamicPromoCode | null> => {
    try {
      const created = await createPromoCodeInFirestore(input);
      showToast(`Gift code ${created.code} ready (${formatPromoRewardSummary(created)})!`);
      return created;
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to create gift code.'));
      return null;
    }
  };

  const handleTogglePromoCode = async (code: string, isActive: boolean) => {
    try {
      await togglePromoCodeInFirestore(code, isActive);
      showToast(isActive ? `Promo ${code} activated!` : `Promo ${code} paused.`);
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to update promo code.'));
    }
  };

  const handleDeletePromoCode = async (code: string) => {
    try {
      await deletePromoCodeInFirestore(code);
      showToast(`Promo ${code} deleted.`);
    } catch (err) {
      showToast(formatSyncErrorMessage(err, 'Failed to delete promo code.'));
    }
  };

  const handleVerifyAdminPasscode = async (
    passcode: string,
  ): Promise<{ ok: boolean; error?: string; needsPasscodeSetup?: boolean }> => {
    try {
      const effectivePlayerId = detectedIdentity.playerId || profile.uid || activePlayerId;
      const endpointUrl = resolveApiUrl('/api/admin/auth');
      const response = await fetch(endpointUrl, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: effectivePlayerId,
          initData: getTelegramInitData(),
          passcode: passcode.trim(),
        }),
      });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const isJson = contentType.includes('application/json');
      const payload = (isJson ? await response.json().catch(() => ({})) : {}) as {
        ok?: boolean;
        token?: string;
        needsPasscodeSetup?: boolean;
        passcodeSource?: 'database' | 'server_file' | 'env' | 'default' | 'unconfigured';
        passcodeUpdatedAtMs?: number;
        error?: string;
      };
      if (payload.passcodeSource) {
        setAdminPasscodeSource(payload.passcodeSource);
      }
      if (typeof payload.passcodeUpdatedAtMs === 'number') {
        setAdminPasscodeUpdatedAtMs(payload.passcodeUpdatedAtMs);
      }
      if (typeof payload.needsPasscodeSetup === 'boolean') {
        setAdminNeedsPasscodeSetup(payload.needsPasscodeSetup);
      }
      if (response.ok && payload.ok) {
        setAdminNeedsPasscodeSetup(false);
        if (payload.token) {
          setAdminSessionToken(payload.token);
        }
        setAdminUnlocked(true);
        playClaimSound(soundsEnabled);
        triggerHapticFeedback('success');
        showToast('Admin Console unlocked!');
        return { ok: true };
      }

      const isMissingApiEndpoint = response.status === 404 || response.status === 405 || !isJson;
      if (isMissingApiEndpoint) {
        return {
          ok: false,
          error: 'Admin verification server unavailable. Open from the live Alpha Gram backend host.',
        };
      }

      return {
        ok: false,
        needsPasscodeSetup: payload.needsPasscodeSetup,
        error:
          payload.error ||
          (response.status >= 500
            ? 'Server error while verifying Admin Passcode.'
            : 'Incorrect Admin Passcode. Please try again.'),
      };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach verification server. Please check your connection.',
      };
    }
  };

  const handleSetupInitialAdminPasscode = async (
    passcode: string,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const effectivePlayerId = detectedIdentity.playerId || profile.uid || activePlayerId;
      const response = await fetch(resolveApiUrl('/api/admin/setup-passcode'), {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: effectivePlayerId,
          initData: getTelegramInitData(),
          passcode: passcode.trim(),
        }),
      });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const payload = (
        contentType.includes('application/json') ? await response.json().catch(() => ({})) : {}
      ) as {
        ok?: boolean;
        token?: string;
        passcodeSource?: 'database' | 'server_file' | 'env' | 'default' | 'unconfigured';
        passcodeUpdatedAtMs?: number;
        error?: string;
      };
      if (response.ok && payload.ok) {
        setAdminNeedsPasscodeSetup(false);
        if (payload.passcodeSource) {
          setAdminPasscodeSource(payload.passcodeSource);
        }
        if (typeof payload.passcodeUpdatedAtMs === 'number') {
          setAdminPasscodeUpdatedAtMs(payload.passcodeUpdatedAtMs);
        }
        if (payload.token) {
          setAdminSessionToken(payload.token);
        }
        setAdminUnlocked(true);
        playClaimSound(soundsEnabled);
        triggerHapticFeedback('success');
        showToast('Initial Admin Passcode saved & unlocked!');
        return { ok: true };
      }
      return {
        ok: false,
        error: payload.error || 'Unable to set initial Admin Passcode.',
      };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach verification server. Please check your connection.',
      };
    }
  };

  const handleFetchChannelDiagnosticLogs = useCallback(async () => {
    setLoadingChannelLogs(true);
    setChannelLogsError(null);
    try {
      const endpointUrl = resolveApiUrl('/api/admin/channel-logs');
      const response = await fetch(endpointUrl, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: latestProfileRef.current.uid,
          initData: getTelegramInitData(),
          token: adminSessionToken,
          limit: 5,
        }),
      });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json') || response.status === 404 || response.status === 405) {
        const localLogs = loadLocalChannelLogs() as unknown as ChannelCheckDiagnosticLog[];
        setChannelDiagnosticLogs(localLogs.slice(0, 5));
        setChannelLogsError(null);
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        logs?: ChannelCheckDiagnosticLog[];
        error?: string;
      };
      if (response.ok && payload.ok && Array.isArray(payload.logs)) {
        setChannelDiagnosticLogs(payload.logs.slice(0, 5));
        return;
      }
      setChannelLogsError(payload.error || `Failed to load diagnostic logs (HTTP ${response.status}).`);
    } catch {
      const localLogs = loadLocalChannelLogs() as unknown as ChannelCheckDiagnosticLog[];
      if (localLogs.length > 0) {
        setChannelDiagnosticLogs(localLogs.slice(0, 5));
        setChannelLogsError(null);
      } else {
        setChannelLogsError('Network error while loading channel check diagnostic logs.');
      }
    } finally {
      setLoadingChannelLogs(false);
    }
  }, [adminSessionToken]);

  const handleFetchSystemDiagnostics = useCallback(
    async (forceHeartbeat = false) => {
      setLoadingSystemDiagnostics(true);
      setSystemDiagnosticsError(null);
      try {
        const endpointUrl = resolveApiUrl('/api/admin/system-diagnostics');
        const response = await fetch(endpointUrl, {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: latestProfileRef.current.uid,
            initData: getTelegramInitData(),
            token: adminSessionToken,
            forceHeartbeat,
          }),
        });
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('application/json') || response.status === 404 || response.status === 405) {
          const fsStart = Date.now();
          const fsConnected = await testFirestoreConnection();
          const fsLatencyMs = Math.max(1, Date.now() - fsStart);
          const localBot = getLocalAdminBotConfig();
          let botOk = false;
          let botLatencyMs: number | null = null;
          let botUsername = localBot?.botUsername ?? null;
          let botId = localBot?.botId ?? null;
          let botError: string | null = localBot
            ? null
            : 'Static preview mode (no Node backend). Save a Bot Token above to run live browser heartbeat.';

          if (localBot) {
            const probe = await verifyTelegramBotTokenDirect(localBot.token);
            botOk = probe.ok;
            botLatencyMs = probe.latencyMs ?? null;
            if (probe.ok) {
              botUsername = probe.botUsername || botUsername;
              botId = probe.botId ?? botId;
              botError = null;
            } else {
              botError = probe.error || 'Bot heartbeat probe failed.';
            }
          }

          const localLogs = loadLocalChannelLogs() as unknown as ChannelCheckDiagnosticLog[];
          const nowMs = Date.now();
          const subscriberCount = recentPlayers.filter((p) =>
            Boolean(extractTelegramNumericUserId(p.uid)),
          ).length;

          const previewSnapshot: SystemDiagnosticsSnapshot = {
            ok: true,
            serverTimeMs: nowMs,
            uptimeSec: Math.round(typeof performance !== 'undefined' ? performance.now() / 1000 : 0),
            nodeVersion: 'Static Preview (Browser)',
            env: 'static-preview',
            memoryMb: { rss: 0, heapUsed: 0, heapTotal: 0 },
            bot: {
              configured: Boolean(localBot),
              username: botUsername,
              botId,
              lastHeartbeatAtMs: nowMs,
              lastHeartbeatOk: botOk,
              latencyMs: botLatencyMs,
              error: botError,
              webhookUrl: null,
              pendingUpdateCount: 0,
              subscriberCount,
              activePollIntervalSec: 0,
            },
            firestore: {
              connected: fsConnected,
              databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
              projectId: firebaseConfig.projectId || '',
              readOk: fsConnected,
              latencyMs: fsLatencyMs,
              error: fsConnected ? null : 'Firestore read check failed',
            },
            channelCheckStats: {
              totalLogsRecorded: localLogs.length,
              lastCheckAtMs: localLogs[0]?.timestampMs ?? null,
            },
            rateLimitBucketsCount: 0,
            serverLogs: [
              {
                id: `prev_fs_${nowMs}`,
                timestampMs: nowMs,
                level: fsConnected ? 'info' : 'error',
                source: 'firestore',
                message: fsConnected
                  ? `Firestore connected in ${fsLatencyMs} ms (${firebaseConfig.projectId})`
                  : 'Firestore health check failed',
              },
              {
                id: `prev_bot_${nowMs}`,
                timestampMs: nowMs,
                level: botOk ? 'info' : 'warn',
                source: 'telegram-bot',
                message: localBot
                  ? botOk
                    ? `Direct Bot API heartbeat OK (@${botUsername}) in ${botLatencyMs ?? 0} ms`
                    : `Direct Bot API error: ${botError}`
                  : 'Running on static preview host without Express server; add Bot Token above for direct checks',
              },
            ],
          };
          setSystemDiagnostics(previewSnapshot);
          setSystemDiagnosticsError(null);
          return;
        }
        const payload = (await response.json().catch(() => ({}))) as Partial<SystemDiagnosticsSnapshot> & {
          error?: string;
        };
        if (response.ok && payload.ok && payload.bot && payload.firestore && Array.isArray(payload.serverLogs)) {
          setSystemDiagnostics(payload as SystemDiagnosticsSnapshot);
          return;
        }
        setSystemDiagnosticsError(
          payload.error || `Failed to load system diagnostics (HTTP ${response.status}).`,
        );
      } catch {
        setSystemDiagnosticsError('Network error while loading system diagnostics.');
      } finally {
        setLoadingSystemDiagnostics(false);
      }
    },
    [adminSessionToken, recentPlayers],
  );

  const handleTestChannelsDiagnostic = async (
    channelsOverride?: typeof activeRequiredChannels,
  ) => {
    try {
      const endpointUrl = resolveApiUrl('/api/telegram/test-channels');
      const response = await fetch(endpointUrl, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: profile.uid,
          initData: getTelegramInitData(),
          token: adminSessionToken,
          requiredChannels: channelsOverride,
        }),
      });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json') || response.status === 404 || response.status === 405) {
        const localBot = getLocalAdminBotConfig();
        const targetChannels = channelsOverride && channelsOverride.length > 0 ? channelsOverride : activeRequiredChannels;
        if (!localBot) {
          const existingLogs = loadLocalChannelLogs() as unknown as ChannelCheckDiagnosticLog[];
          return {
            ok: false,
            botConfigured: false,
            botError:
              'Static preview detected (no Express server). Save your Telegram Bot Token above to run live channel tests directly, or open from the Node backend.',
            recentLogs: existingLogs.slice(0, 5),
          };
        }
        const probe = await verifyTelegramBotTokenDirect(localBot.token);
        if (!probe.ok || !probe.botId) {
          return {
            ok: false,
            botConfigured: true,
            botUsername: localBot.botUsername,
            botError: probe.error || 'Bot token verification failed.',
          };
        }
        setServerBotConfigured(true);
        const tgNumericId = extractTelegramNumericUserId(profile.uid);
        const results = await Promise.all(
          targetChannels.map(async (ch) => {
            const chatTarget = /^-?\d+$/.test(ch.handle.trim())
              ? ch.handle.trim()
              : `@${ch.handle.trim().replace(/^@+/, '')}`;
            let botIsAdmin = false;
            let botStatus = 'unknown';
            let userJoined: boolean | null = null;
            let userStatus: string | null = null;
            let errMsg: string | undefined;

            try {
              const bRes = await fetch(
                `https://api.telegram.org/bot${localBot.token}/getChatMember?chat_id=${encodeURIComponent(chatTarget)}&user_id=${probe.botId}`,
                { cache: 'no-store' },
              );
              const bData = (await bRes.json().catch(() => ({}))) as {
                ok?: boolean;
                description?: string;
                result?: { status?: string };
              };
              botStatus = String(bData.result?.status || (bData.ok ? 'unknown' : 'api_error'));
              botIsAdmin = Boolean(bData.ok && (botStatus === 'administrator' || botStatus === 'creator'));
              if (!bData.ok) errMsg = bData.description || 'Failed to inspect bot channel status';
            } catch {
              botStatus = 'network_error';
              errMsg = 'Network error calling Telegram API';
            }

            if (tgNumericId) {
              try {
                const uRes = await fetch(
                  `https://api.telegram.org/bot${localBot.token}/getChatMember?chat_id=${encodeURIComponent(chatTarget)}&user_id=${encodeURIComponent(tgNumericId)}`,
                  { cache: 'no-store' },
                );
                const uData = (await uRes.json().catch(() => ({}))) as {
                  ok?: boolean;
                  result?: { status?: string; is_member?: boolean };
                };
                userStatus = String(uData.result?.status || '');
                userJoined =
                  Boolean(uData.ok) &&
                  (userStatus === 'creator' ||
                    userStatus === 'administrator' ||
                    userStatus === 'member' ||
                    (userStatus === 'restricted' && uData.result?.is_member === true));
              } catch {
                userJoined = false;
              }
            }

            return {
              id: ch.id,
              handle: ch.handle,
              botIsAdmin,
              botStatus,
              userJoined,
              userStatus,
              error: errMsg,
            };
          }),
        );

        const nowMs = Date.now();
        const logEntry: ChannelCheckDiagnosticLog = {
          id: `test_${nowMs}`,
          timestampMs: nowMs,
          endpoint: 'test-channels',
          userIdSource: 'static_preview_direct',
          telegramUserId: tgNumericId,
          verificationMode: 'telegram_bot',
          allJoined: results.every((r) => r.userJoined === true),
          fromFirestore: true,
          botConfigured: true,
          botUsername: probe.botUsername || localBot.botUsername,
          error: null,
          channels: results.map((r) => ({
            handle: r.handle,
            joined: r.userJoined === true,
            status: r.userStatus || r.botStatus,
            botIsAdmin: r.botIsAdmin,
            botStatus: r.botStatus,
            rawDescription: r.error,
          })),
        };
        const updatedLogs = appendLocalChannelLog(logEntry as unknown as Record<string, unknown>);
        const sliced = updatedLogs.slice(0, 5) as unknown as ChannelCheckDiagnosticLog[];
        setChannelDiagnosticLogs(sliced);
        setChannelLogsError(null);
        return {
          ok: true,
          botConfigured: true,
          botUsername: probe.botUsername || localBot.botUsername,
          channels: results,
          recentLogs: sliced,
        };
      }

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        botConfigured?: boolean;
        botUsername?: string | null;
        botError?: string;
        error?: string;
        recentLogs?: ChannelCheckDiagnosticLog[];
        channels?: Array<{
          id: string;
          handle: string;
          botIsAdmin: boolean;
          botStatus: string;
          userJoined?: boolean | null;
          userStatus?: string | null;
          error?: string;
        }>;
      };
      if (typeof payload.botConfigured === 'boolean') {
        setServerBotConfigured(payload.botConfigured);
      }
      if (Array.isArray(payload.recentLogs)) {
        setChannelDiagnosticLogs(payload.recentLogs.slice(0, 5));
        setChannelLogsError(null);
      }
      return {
        ok: Boolean(response.ok && payload.ok),
        ...payload,
      };
    } catch {
      return {
        ok: false,
        error: 'Unable to reach channel verification server.',
      };
    }
  };

  const handleLockAdmin = () => {
    setAdminUnlocked(false);
    setAdminSessionToken('');
    showToast('Admin Console locked.');
  };

  const handleBanPlayer = async (input: {
    targetId: string;
    displayName?: string;
    handle?: string;
    reason?: string;
  }) => {
    const record = await banPlayerInFirestore({
      targetId: input.targetId,
      displayName: input.displayName,
      handle: input.handle,
      reason: input.reason,
      bannedBy: profile.uid,
      extraAdminIds,
    });
    const label = record.displayName || getPrimaryDepositMemo(record.uid) || record.uid;
    showToast(`Blocked player ${label}!`);
  };

  const handleUnbanPlayer = async (targetId: string) => {
    await unbanPlayerInFirestore(targetId);
    const label = getPrimaryDepositMemo(targetId) || targetId;
    showToast(`Unblocked player ${label}!`);
  };

  const handleSearchUsers = async (query: string): Promise<UserFarmProfile[]> => {
    return searchUsersInFirestore(query, recentPlayers);
  };

  const handleFetchPlayerReferrals = async (playerUid: string): Promise<ReferralRecord[]> => {
    return fetchPlayerReferralsFromFirestore(playerUid);
  };

  const handleAdjustCoins = async (input: {
    targetUid: string;
    deltaCoins: number;
    note?: string;
  }): Promise<UserFarmProfile> => {
    const res = await adjustPlayerCoinsInFirestore({
      adminUid: profile.uid,
      targetUid: input.targetUid,
      deltaCoins: input.deltaCoins,
      note: input.note,
      extraAdminIds,
    });
    setRecentPlayers((prev) =>
      prev.map((p) => (p.uid === res.profile.uid ? res.profile : p)),
    );
    const label = res.profile.displayName || getPrimaryDepositMemo(res.profile.uid);
    showToast(
      res.actualDelta >= 0
        ? `Added +${res.actualDelta.toLocaleString()} coins to ${label}!`
        : `Removed ${Math.abs(res.actualDelta).toLocaleString()} coins from ${label}!`,
    );
    return res.profile;
  };

  const handleAdjustReferralCount = async (input: {
    targetUid: string;
    deltaRefers: number;
  }): Promise<UserFarmProfile> => {
    const res = await adjustPlayerReferralCountInFirestore({
      adminUid: profile.uid,
      targetUid: input.targetUid,
      deltaRefers: input.deltaRefers,
      extraAdminIds,
    });
    setRecentPlayers((prev) =>
      prev.map((p) => (p.uid === res.profile.uid ? res.profile : p)),
    );
    const label = res.profile.displayName || getPrimaryDepositMemo(res.profile.uid);
    showToast(
      res.actualDelta >= 0
        ? `Added +${res.actualDelta} refers to ${label}!`
        : `Removed ${Math.abs(res.actualDelta)} refers from ${label}!`,
    );
    return res.profile;
  };

  const handleAdjustWithdrawAds = async (input: {
    targetUid: string;
    deltaAds?: number;
    targetAds?: number;
  }): Promise<UserFarmProfile> => {
    const res = await adjustPlayerWithdrawAdsInFirestore({
      adminUid: profile.uid,
      targetUid: input.targetUid,
      deltaAds: input.deltaAds,
      targetAds: input.targetAds,
      extraAdminIds,
    });
    setRecentPlayers((prev) =>
      prev.map((p) => (p.uid === res.profile.uid ? res.profile : p)),
    );
    if (res.profile.uid === latestProfileRef.current.uid) {
      latestProfileRef.current = res.profile;
      setProfile(res.profile);
    }
    const label = res.profile.displayName || getUnifiedUserId(res.profile.uid);
    showToast(
      `Updated ${label} withdraw ads: ${res.nextAds}/${MIN_WITHDRAW_ADS_WATCHED}`,
    );
    return res.profile;
  };

  const handleFetchBotConfig = useCallback(async () => {
    const applyLocalFallback = () => {
      const localBot = getLocalAdminBotConfig();
      if (localBot) {
        setBotConfigStatus({
          configured: true,
          source: 'local_preview',
          maskedToken: localBot.maskedToken,
          botUsername: localBot.botUsername,
          updatedAtMs: localBot.updatedAtMs,
        });
        setServerBotConfigured(true);
        cacheDetectedTelegramBotConfig(localBot.botUsername, telegramBotConfig.appShortName);
        setTelegramBotConfig(
          detectBrowserTelegramBotConfig({
            serverBotUsername: localBot.botUsername,
            serverAppShortName: telegramBotConfig.appShortName,
          }),
        );
      } else {
        setBotConfigStatus({
          configured: false,
          source: 'none',
          maskedToken: '',
          botUsername: null,
          updatedAtMs: 0,
        });
      }
    };

    try {
      const res = await fetch(resolveApiUrl('/api/admin/bot-config/get'), {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: latestProfileRef.current.uid,
          token: adminSessionToken,
          initData: getTelegramInitData(),
        }),
      });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json') || res.status === 404 || res.status === 405) {
        applyLocalFallback();
        return;
      }
      const payload = (await res.json().catch(() => null)) as {
        ok?: boolean;
        configured?: boolean;
        source?: 'runtime' | 'env' | 'none';
        maskedToken?: string;
        botUsername?: string | null;
        updatedAtMs?: number;
      } | null;
      if (res.ok && payload?.ok) {
        setBotConfigStatus({
          configured: Boolean(payload.configured),
          source: payload.source || 'none',
          maskedToken: payload.maskedToken || '',
          botUsername: payload.botUsername ?? null,
          updatedAtMs: Number(payload.updatedAtMs || 0),
        });
        setServerBotConfigured(Boolean(payload.configured));
        if (payload.botUsername) {
          cacheDetectedTelegramBotConfig(payload.botUsername, telegramBotConfig.appShortName);
          setTelegramBotConfig(
            detectBrowserTelegramBotConfig({
              serverBotUsername: payload.botUsername,
              serverAppShortName: telegramBotConfig.appShortName,
            }),
          );
        }
      }
    } catch {
      applyLocalFallback();
    }
  }, [adminSessionToken, telegramBotConfig.appShortName]);

  useEffect(() => {
    if (!adminUnlocked || !adminSessionToken) return;
    void handleFetchBotConfig();
  }, [adminSessionToken, adminUnlocked, handleFetchBotConfig]);

  const handleSaveBotToken = async (botToken: string) => {
    const saveViaDirectTelegramPreview = async () => {
      const verified = await verifyTelegramBotTokenDirect(botToken);
      if (!verified.ok || !verified.token || !verified.botUsername) {
        return { ok: false, error: verified.error || 'Failed to verify Bot Token.' };
      }
      const nowMs = Date.now();
      setLocalAdminBotConfig({
        token: verified.token,
        maskedToken: verified.maskedToken || '',
        botUsername: verified.botUsername,
        botId: verified.botId ?? null,
        updatedAtMs: nowMs,
      });
      setBotConfigStatus({
        configured: true,
        source: 'local_preview',
        maskedToken: verified.maskedToken || '',
        botUsername: verified.botUsername,
        updatedAtMs: nowMs,
      });
      setServerBotConfigured(true);
      cacheDetectedTelegramBotConfig(verified.botUsername, telegramBotConfig.appShortName);
      setTelegramBotConfig(
        detectBrowserTelegramBotConfig({
          serverBotUsername: verified.botUsername,
          serverAppShortName: telegramBotConfig.appShortName,
        }),
      );
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast(`Telegram bot @${verified.botUsername} connected (Static Preview)!`);
      void handleFetchSystemDiagnostics(true);
      return {
        ok: true,
        botUsername: verified.botUsername,
        maskedToken: verified.maskedToken,
      };
    };

    try {
      const res = await fetch(resolveApiUrl('/api/admin/bot-config'), {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: latestProfileRef.current.uid,
          token: adminSessionToken,
          initData: getTelegramInitData(),
          botToken,
        }),
      });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json') || res.status === 404 || res.status === 405) {
        return saveViaDirectTelegramPreview();
      }
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        configured?: boolean;
        source?: 'runtime' | 'env' | 'none';
        maskedToken?: string;
        botUsername?: string | null;
        updatedAtMs?: number;
        error?: string;
      };
      if (res.ok && payload.ok) {
        setBotConfigStatus({
          configured: Boolean(payload.configured ?? true),
          source: payload.source || 'runtime',
          maskedToken: payload.maskedToken || '',
          botUsername: payload.botUsername ?? null,
          updatedAtMs: Number(payload.updatedAtMs || Date.now()),
        });
        setServerBotConfigured(true);
        if (payload.botUsername) {
          cacheDetectedTelegramBotConfig(payload.botUsername, telegramBotConfig.appShortName);
          setTelegramBotConfig(
            detectBrowserTelegramBotConfig({
              serverBotUsername: payload.botUsername,
              serverAppShortName: telegramBotConfig.appShortName,
            }),
          );
        }
        playClaimSound(soundsEnabled);
        triggerHapticFeedback('success');
        showToast(
          payload.botUsername
            ? `Telegram bot @${payload.botUsername} connected!`
            : 'Telegram Bot Token saved!',
        );
        void handleFetchSystemDiagnostics(true);
        return {
          ok: true,
          botUsername: payload.botUsername ?? null,
          maskedToken: payload.maskedToken,
        };
      }
      return { ok: false, error: payload.error || 'Failed to save Bot Token.' };
    } catch {
      return saveViaDirectTelegramPreview();
    }
  };

  const handleClearBotToken = async () => {
    const clearLocalFallback = () => {
      clearLocalAdminBotConfig();
      setBotConfigStatus({
        configured: false,
        source: 'none',
        maskedToken: '',
        botUsername: null,
        updatedAtMs: Date.now(),
      });
      setServerBotConfigured(false);
      showToast('Cleared saved Telegram Bot Token.');
      void handleFetchSystemDiagnostics(true);
      return { ok: true };
    };

    try {
      const res = await fetch(resolveApiUrl('/api/admin/bot-config/clear'), {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: latestProfileRef.current.uid,
          token: adminSessionToken,
          initData: getTelegramInitData(),
        }),
      });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json') || res.status === 404 || res.status === 405) {
        return clearLocalFallback();
      }
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        configured?: boolean;
        source?: 'runtime' | 'env' | 'none';
        maskedToken?: string;
        botUsername?: string | null;
        error?: string;
      };
      if (res.ok && payload.ok) {
        clearLocalAdminBotConfig();
        setBotConfigStatus({
          configured: Boolean(payload.configured),
          source: payload.source || 'none',
          maskedToken: payload.maskedToken || '',
          botUsername: payload.botUsername ?? null,
          updatedAtMs: Date.now(),
        });
        setServerBotConfigured(Boolean(payload.configured));
        showToast('Cleared saved Telegram Bot Token.');
        void handleFetchSystemDiagnostics(true);
        return { ok: true };
      }
      return { ok: false, error: payload.error || 'Failed to clear Bot Token.' };
    } catch {
      return clearLocalFallback();
    }
  };

  const handleAddReferralRelation = async (input: {
    referrerIdOrCode: string;
    referredIdOrCode: string;
    bonusCoins?: number;
  }) => {
    const res = await adminAddReferralRelationInFirestore({
      adminUid: profile.uid,
      referrerIdOrCode: input.referrerIdOrCode,
      referredIdOrCode: input.referredIdOrCode,
      bonusCoins: input.bonusCoins,
      extraAdminIds,
    });
    setRecentPlayers((prev) =>
      prev.map((p) => {
        if (p.uid === res.referrerProfile.uid) return res.referrerProfile;
        if (p.uid === res.referredProfile.uid) return res.referredProfile;
        return p;
      }),
    );
    if (latestProfileRef.current.uid === res.referrerProfile.uid) {
      latestProfileRef.current = res.referrerProfile;
      setProfile(res.referrerProfile);
    } else if (latestProfileRef.current.uid === res.referredProfile.uid) {
      latestProfileRef.current = res.referredProfile;
      setProfile(res.referredProfile);
    }
    void safeFetchJson('/api/referrals/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'signup_bonus',
        referrerUid: res.referrerProfile.uid,
        referredUid: res.referredProfile.uid,
        referredName: res.referredProfile.displayName,
        referredHandle: res.referredProfile.handle,
        rewardCoins: res.referralRecord.coinsEarned,
        initData: getTelegramInitData(),
        token: playerSessionTokenRef.current,
      }),
    });
    showToast(
      `Linked ${res.referredProfile.displayName} under ${res.referrerProfile.displayName}!`,
    );
    return res;
  };

  const handleRemoveReferralRelation = async (input: {
    referrerUid: string;
    referredUid: string;
  }) => {
    const res = await adminRemoveReferralRelationInFirestore({
      adminUid: profile.uid,
      referrerUid: input.referrerUid,
      referredUid: input.referredUid,
      extraAdminIds,
    });
    setRecentPlayers((prev) =>
      prev.map((p) => {
        if (res.referrerProfile && p.uid === res.referrerProfile.uid) {
          return res.referrerProfile;
        }
        if (res.referredProfile && p.uid === res.referredProfile.uid) {
          return res.referredProfile;
        }
        return p;
      }),
    );
    showToast('Removed referral link & updated counts!');
    return res;
  };

  const handleAddAdmin = async (input: {
    targetId: string;
    displayName?: string;
    handle?: string;
  }) => {
    const nextConfig = await addAdminInFirestore({
      actorUid: profile.uid,
      targetId: input.targetId,
      displayName: input.displayName,
      handle: input.handle,
    });
    setAdminsConfig(nextConfig);
    const label = getPrimaryDepositMemo(input.targetId) || input.targetId;
    showToast(`Added Co-Admin ${label}!`);
  };

  const handleRemoveAdmin = async (targetId: string) => {
    const nextConfig = await removeAdminInFirestore({
      actorUid: profile.uid,
      targetId,
    });
    setAdminsConfig(nextConfig);
    const label = getPrimaryDepositMemo(targetId) || targetId;
    showToast(`Removed Co-Admin ${label}!`);
  };

  const handleSaveWithdrawApproveTemplate = async (
    tpl: Omit<WithdrawApproveMessageTemplate, 'updatedAtMs'>,
  ): Promise<boolean> => {
    if (!hasVerifiedAdminSession()) {
      setAdminUnlocked(false);
      setAdminSessionToken('');
      showToast('Admin passcode verification required before editing payout templates.');
      return false;
    }
    let firestoreSaved: WithdrawApproveMessageTemplate | null = null;
    let firestoreErr: unknown = null;
    try {
      firestoreSaved = await saveWithdrawApproveTemplateInFirestore(tpl);
    } catch (err) {
      firestoreErr = err;
    }

    const serverRes = await safeFetchJson<{
      ok?: boolean;
      template?: WithdrawApproveMessageTemplate;
    }>('/api/admin/payout-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...tpl,
        token: adminSessionToken,
        initData: getTelegramInitData(),
      }),
    });

    const finalSaved = firestoreSaved || (serverRes?.ok ? serverRes.template || { ...tpl, updatedAtMs: Date.now() } : null);
    if (finalSaved) {
      setWithdrawApproveTemplate(finalSaved);
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      showToast(
        firestoreSaved
          ? 'Withdrawal approval DM message saved & synced!'
          : 'Approval DM message saved to bot server!',
      );
      return true;
    }

    showToast(formatSyncErrorMessage(firestoreErr, 'Failed to save approval DM template.'));
    return false;
  };

  const handleFetchBroadcastStats = useCallback(
    async (excludeBanned: boolean) => {
      const buildStaticStats = () => {
        const bannedSet = new Set(bannedUsers.map((b) => b.uid));
        const tgPlayers = recentPlayers.filter((p) => {
          if (!extractTelegramNumericUserId(p.uid)) return false;
          if (excludeBanned && bannedSet.has(p.uid)) return false;
          return true;
        });
        return {
          ok: true,
          totalRecipients: tgPlayers.length,
          botSubscriberCount: tgPlayers.length,
          blockedBotCount: 0,
          playerRecipientCount: tgPlayers.length,
        };
      };

      try {
        const res = await fetch(resolveApiUrl('/api/admin/broadcast/stats'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: adminSessionToken,
            initData: getTelegramInitData(),
            excludeBanned,
          }),
        });
        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('application/json') || res.status === 404 || res.status === 405) {
          return buildStaticStats();
        }
        const payload = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          totalRecipients?: number;
          botSubscriberCount?: number;
          blockedBotCount?: number;
          playerRecipientCount?: number;
          error?: string;
        };
        return { ok: Boolean(res.ok && payload.ok), ...payload };
      } catch {
        return buildStaticStats();
      }
    },
    [adminSessionToken, bannedUsers, recentPlayers],
  );

  const handleSyncBotSubscribers = useCallback(async () => {
    try {
      const res = await fetch(resolveApiUrl('/api/admin/telegram/sync-bot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: adminSessionToken,
          initData: getTelegramInitData(),
        }),
      });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json') || res.status === 404 || res.status === 405) {
        const tgCount = recentPlayers.filter((p) => Boolean(extractTelegramNumericUserId(p.uid))).length;
        showToast(`Static preview: ${tgCount} active Telegram farm players ready.`);
        return {
          ok: true,
          totalRecipients: tgCount,
          botSubscriberCount: tgCount,
          blockedBotCount: 0,
          playerRecipientCount: tgCount,
          newUpdates: 0,
          webhookActive: false,
        };
      }
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        totalRecipients?: number;
        botSubscriberCount?: number;
        blockedBotCount?: number;
        playerRecipientCount?: number;
        poll?: { newUpdates?: number; webhookActive?: boolean; error?: string };
        error?: string;
      };
      if (res.ok && payload.ok) {
        const syncedNew = payload.poll?.newUpdates ?? 0;
        showToast(
          syncedNew > 0
            ? `Synced ${syncedNew} new bot user${syncedNew === 1 ? '' : 's'}! Total: ${payload.totalRecipients ?? 0}`
            : `Bot audience synced (${payload.totalRecipients ?? 0} reachable).`,
        );
        return {
          ok: true,
          totalRecipients: payload.totalRecipients,
          botSubscriberCount: payload.botSubscriberCount,
          blockedBotCount: payload.blockedBotCount,
          playerRecipientCount: payload.playerRecipientCount,
          newUpdates: syncedNew,
          webhookActive: payload.poll?.webhookActive,
        };
      }
      const errMsg = payload.error || payload.poll?.error || 'Could not sync bot users.';
      showToast(errMsg);
      return { ok: false, error: errMsg };
    } catch {
      const errMsg = 'Network error syncing bot subscribers.';
      showToast(errMsg);
      return { ok: false, error: errMsg };
    }
  }, [adminSessionToken, recentPlayers, showToast]);

  const handleSendBroadcast = async (input: {
    title: string;
    message: string;
    mediaType: 'none' | 'photo' | 'video' | 'animation';
    mediaUrl?: string;
    mediaDataUrl?: string;
    mediaFilename?: string;
    buttonText?: string;
    buttonUrl?: string;
    excludeBanned?: boolean;
    testOnlyToAdmin?: boolean;
  }) => {
    const sendDirectFromBrowserPreview = async () => {
      const localBot = getLocalAdminBotConfig();
      if (!localBot) {
        const errMsg =
          'Static preview: Paste & verify your Telegram Bot Token above first to broadcast from browser.';
        showToast(errMsg);
        return { ok: false, error: errMsg };
      }

      const bannedSet = new Set(bannedUsers.map((b) => b.uid));
      const adminNumeric = extractTelegramNumericUserId(profile.uid);
      const targets = input.testOnlyToAdmin
        ? adminNumeric
          ? [adminNumeric]
          : []
        : Array.from(
            new Set(
              recentPlayers
                .filter((p) => !(input.excludeBanned !== false && bannedSet.has(p.uid)))
                .map((p) => extractTelegramNumericUserId(p.uid))
                .filter((id): id is string => Boolean(id)),
            ),
          );

      if (targets.length === 0) {
        const errMsg = 'No reachable Telegram user IDs found for broadcast.';
        showToast(errMsg);
        return { ok: false, error: errMsg };
      }

      const fullText = [input.title?.trim(), input.message.trim()]
        .filter(Boolean)
        .join('\n\n')
        .slice(0, input.mediaType === 'none' ? 4000 : 1024);
      const replyMarkup =
        input.buttonText?.trim() && input.buttonUrl?.trim()
          ? {
              inline_keyboard: [
                [{ text: input.buttonText.trim(), url: input.buttonUrl.trim() }],
              ],
            }
          : {
              inline_keyboard: [
                [
                  {
                    text: '🐔 Open Alpha Gram',
                    url: `https://t.me/${telegramBotConfig.botUsername}/${telegramBotConfig.appShortName}`,
                  },
                ],
              ],
            };

      const dataUrlToBlob = (dataUrl: string): { blob: Blob; filename: string } | null => {
        const match = String(dataUrl || '')
          .trim()
          .match(/^data:([a-z0-9/+.-]*)(?:;[^,;]+=[^,;]*)*;base64,([A-Za-z0-9+/=\s]+)$/i);
        if (!match) return null;
        const fallbackMime =
          input.mediaType === 'video'
            ? 'video/mp4'
            : input.mediaType === 'animation'
              ? 'image/gif'
              : 'image/jpeg';
        const mime =
          match[1] && match[1] !== 'application/octet-stream'
            ? match[1].toLowerCase()
            : fallbackMime;
        const binStr = atob(match[2].replace(/\s+/g, ''));
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i += 1) {
          bytes[i] = binStr.charCodeAt(i);
        }
        const safeName =
          (input.mediaFilename || '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 48) ||
          (input.mediaType === 'video'
            ? 'broadcast.mp4'
            : input.mediaType === 'animation'
              ? 'broadcast.gif'
              : 'broadcast.jpg');
        return { blob: new Blob([bytes], { type: mime }), filename: safeName };
      };

      const parsedBlob =
        input.mediaType !== 'none' && input.mediaDataUrl
          ? dataUrlToBlob(input.mediaDataUrl)
          : null;
      const endpoint =
        input.mediaType === 'photo'
          ? 'sendPhoto'
          : input.mediaType === 'video'
            ? 'sendVideo'
            : input.mediaType === 'animation'
              ? 'sendAnimation'
              : 'sendMessage';
      const mediaField =
        input.mediaType === 'photo'
          ? 'photo'
          : input.mediaType === 'video'
            ? 'video'
            : 'animation';

      let cachedFileId = '';
      let sentCount = 0;
      let failedCount = 0;
      let sampleError = '';
      for (const chatId of targets) {
        try {
          let tgJson: {
            ok?: boolean;
            description?: string;
            result?: {
              photo?: Array<{ file_id?: string }>;
              video?: { file_id?: string };
              animation?: { file_id?: string };
            };
          };
          if (input.mediaType !== 'none' && parsedBlob && !cachedFileId) {
            const form = new FormData();
            form.append('chat_id', chatId);
            form.append(mediaField, parsedBlob.blob, parsedBlob.filename);
            form.append('caption', fullText);
            form.append('reply_markup', JSON.stringify(replyMarkup));
            const tgRes = await fetch(
              `https://api.telegram.org/bot${localBot.token}/${endpoint}`,
              { method: 'POST', body: form },
            );
            tgJson = (await tgRes.json().catch(() => ({}))) as typeof tgJson;
          } else {
            const mediaVal = cachedFileId || input.mediaUrl?.trim() || '';
            const useMedia = input.mediaType !== 'none' && Boolean(mediaVal);
            const activeEndpoint = useMedia ? endpoint : 'sendMessage';
            const bodyPayload: Record<string, unknown> = {
              chat_id: chatId,
              reply_markup: replyMarkup,
              ...(useMedia
                ? { [mediaField]: mediaVal, caption: fullText }
                : { text: fullText }),
            };
            const tgRes = await fetch(
              `https://api.telegram.org/bot${localBot.token}/${activeEndpoint}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyPayload),
              },
            );
            tgJson = (await tgRes.json().catch(() => ({}))) as typeof tgJson;
          }

          if (tgJson.ok) {
            sentCount += 1;
            if (!cachedFileId && parsedBlob && tgJson.result) {
              if (
                input.mediaType === 'photo' &&
                Array.isArray(tgJson.result.photo) &&
                tgJson.result.photo.length > 0
              ) {
                cachedFileId = String(tgJson.result.photo[tgJson.result.photo.length - 1]?.file_id || '');
              } else if (input.mediaType === 'video' && tgJson.result.video?.file_id) {
                cachedFileId = String(tgJson.result.video.file_id);
              } else if (input.mediaType === 'animation' && tgJson.result.animation?.file_id) {
                cachedFileId = String(tgJson.result.animation.file_id);
              }
            }
          } else {
            failedCount += 1;
            if (!sampleError) sampleError = tgJson.description || 'Delivery failed';
          }
        } catch (err) {
          failedCount += 1;
          if (!sampleError) {
            sampleError = err instanceof Error ? err.message : 'Network error';
          }
        }
      }

      if (sentCount > 0) {
        playClaimSound(soundsEnabled);
        triggerHapticFeedback('success');
        showToast(
          input.testOnlyToAdmin
            ? `Test DM sent (${sentCount}/${targets.length})`
            : `Broadcast complete: ${sentCount} delivered`,
        );
        return {
          ok: true,
          totalTargets: targets.length,
          sentCount,
          failedCount,
          blockedCount: 0,
          testOnlyToAdmin: input.testOnlyToAdmin,
          sampleError: sampleError || undefined,
        };
      }
      const errMsg = sampleError || 'Failed to deliver broadcast via Telegram API.';
      showToast(errMsg);
      return { ok: false, error: errMsg, totalTargets: targets.length, sentCount, failedCount };
    };

    try {
      const response = await fetch(resolveApiUrl('/api/admin/broadcast'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          token: adminSessionToken,
          initData: getTelegramInitData(),
        }),
      });
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json') || response.status === 404 || response.status === 405) {
        return sendDirectFromBrowserPreview();
      }
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        totalTargets?: number;
        sentCount?: number;
        failedCount?: number;
        blockedCount?: number;
        testOnlyToAdmin?: boolean;
        sampleError?: string;
        error?: string;
      };
      if (response.ok && payload.ok) {
        playClaimSound(soundsEnabled);
        triggerHapticFeedback('success');
        showToast(
          payload.testOnlyToAdmin
            ? `Test DM sent (${payload.sentCount ?? 0}/${payload.totalTargets ?? 0})`
            : `Broadcast complete: ${payload.sentCount ?? 0} delivered`,
        );
        return { ok: true, ...payload };
      }
      const errMsg = payload.error || 'Failed to send broadcast.';
      showToast(errMsg);
      return { ok: false, error: errMsg, ...payload };
    } catch {
      const localBot = getLocalAdminBotConfig();
      if (localBot) {
        return sendDirectFromBrowserPreview();
      }
      const errMsg = 'Network error while sending broadcast.';
      showToast(errMsg);
      return { ok: false, error: errMsg };
    }
  };

  const handleClaimDaily = () => {
    void (async () => {
      if (!(await ensureMustJoinVerified('claim daily login'))) return;
      const now = Date.now();
      const res = claimDailyStreak(latestProfileRef.current, todayStr, now);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerRewardConfetti();
      void persistMutation({
        nextProfile: res.profile,
        transaction: res.transaction,
      });
      showToast(`Daily login claimed: +${res.rewardCoins} coins!`);
    })();
  };

  const handleAfterPromoAdCompleted = useCallback(
    async (cleanCode: string) => {
      if (!channelsGateEnabled) {
        executeClaimPromo(cleanCode, true);
        return;
      }

      const withCompletedAd = recordCompletedGateAd(latestProfileRef.current);
      void persistMutation({ nextProfile: withCompletedAd });

      const verification = await handleCheckChannels({ silent: true });
      if (
        verification &&
        (verification.allJoined || verification.verificationMode === 'disabled')
      ) {
        executeClaimPromo(cleanCode, false);
        return;
      }

      pendingPromoClaimCodeRef.current = cleanCode;
      setPendingPromoClaimCode(cleanCode);
      setShowChannelGateModal(true);
      triggerHapticFeedback('warning');
    },
    [channelsGateEnabled, executeClaimPromo, handleCheckChannels, persistMutation],
  );

  const handleClaimPromo = (code: string) => {
    if (watchingAdLoading) return;
    void (async () => {
      if (!(await ensureMustJoinVerified('claim promo gift'))) return;
      const now = Date.now();
      const current = latestProfileRef.current;
      const dryRun = claimPromoCode(current, code, now, promoCodes);
      if ('error' in dryRun) {
        showToast(dryRun.error);
        return;
      }

      const cleanCode = code.trim().toUpperCase();
      setWatchingAdLoading(true);
      setActiveAdNetwork(null);
      try {
        const external = await tryRunExternalRewardedAd(adConfig);
        if (external.handled) {
          if (external.rewarded) {
            await handleAfterPromoAdCompleted(cleanCode);
          } else {
            showToast('Complete the ad to claim your gift code.');
          }
          return;
        }
        setAdModalState({
          open: true,
          kind: 'claim_promo',
          promoCode: cleanCode,
          promoRewardSummary: dryRun.rewardSummary,
          notice: external.message ?? null,
          network: null,
          mandatory: false,
        });
      } finally {
        setWatchingAdLoading(false);
      }
    })();
  };

  const isMaintenanceBlocked =
    maintenanceConfig.enabled &&
    !(isAuthorizedAdmin && (subView === 'admin' || adminUnlocked));

  useEffect(() => {
    if (!isMaintenanceBlocked) return;
    setShowSplash(false);
    setShowWelcomeModal(false);
    setShowSignUpBonusModal(false);
    setShowChannelGateModal(false);
    setAdModalState({ open: false, kind: 'watch_ad', notice: null, network: null });
    setShowSettings(false);
  }, [isMaintenanceBlocked]);

  useEffect(() => {
    if (!maintenanceLoaded || maintenanceConfig.enabled) return;
    if (isBanned || skipWelcome || showSplash || !isPlayerSynced || showSignUpBonusModal) return;
    if (subView === 'admin') return;
    if (startupAdTriggeredRef.current) return;
    startupAdTriggeredRef.current = true;

    void (async () => {
      setWatchingAdLoading(true);
      try {
        const external = await tryRunExternalRewardedAd(adConfig);
        if (external.handled && external.rewarded) {
          const updated = recordCompletedGateAd(latestProfileRef.current);
          void persistMutation({ nextProfile: updated });
          return;
        }
        setAdModalState({
          open: true,
          kind: 'startup',
          notice: external.handled
            ? 'Complete the launch ad to enter Alpha Gram.'
            : (external.message ?? null),
          network: null,
          mandatory: true,
        });
      } finally {
        setWatchingAdLoading(false);
      }
    })();
  }, [
    adConfig,
    isBanned,
    isPlayerSynced,
    maintenanceConfig.enabled,
    maintenanceLoaded,
    persistMutation,
    showSignUpBonusModal,
    showSplash,
    skipWelcome,
    subView,
  ]);

  const handleCompleteTask = async (taskId: string) => {
    if (!(await ensureMustJoinVerified('complete tasks'))) return;
    const task = mergeTaskDefinitions(customTasks, liveTaskChannelLinksRef.current).find(
      (t) => t.id === taskId,
    );
    const checkMode = task ? getTaskChannelCheckMode(task) : 'none';
    if (task && checkMode !== 'none') {
      const proofAt = verifiedChannelTaskProofRef.current[taskId] ?? 0;
      const hasFreshProof = proofAt > 0 && Date.now() - proofAt <= 60_000;
      delete verifiedChannelTaskProofRef.current[taskId];
      if (!hasFreshProof) {
        const verifyRes = await handleVerifyTaskChannel(task.actionUrl || '', {
          requireChannelCheck: true,
          channelCheckMode: checkMode,
          taskId,
        });
        delete verifiedChannelTaskProofRef.current[taskId];
        if (!verifyRes.joined) {
          return;
        }
      }
    }

    const now = Date.now();
    const res = completeTask(
      latestProfileRef.current,
      taskId,
      now,
      customTasks,
      liveTaskChannelLinksRef.current,
    );
    if ('error' in res) {
      showToast(res.error);
      return;
    }
    playClaimSound(soundsEnabled);
    triggerHapticFeedback('success');
    void persistMutation({
      nextProfile: res.profile,
      transaction: res.transaction,
    });
    if (res.isCustomTask) {
      void incrementTaskClaimCountInFirestore(taskId).catch(() => {});
    }
    showToast(`Task complete: +${res.rewardCoins} coins!`);
  };

  const handleWatchAd = () => {
    const now = Date.now();
    const res = watchAdStep(latestProfileRef.current, now);
    playClaimSound(soundsEnabled);
    triggerHapticFeedback('success');
    void persistMutation({
      nextProfile: res.profile,
      transaction: res.transaction,
    });
    if (res.hitMilestone) {
      triggerRewardConfetti();
      showToast(`10/10 Bonus Chest! +${res.rewardEggs.toLocaleString()} Free Eggs added!`);
    } else {
      showToast(`+${res.rewardEggs.toLocaleString()} Free Eggs earned! (${res.profile.watchedAdsCount}/10)`);
    }
  };

  const handleClaimAdNetwork = (network: AdNetworkId) => {
    const now = Date.now();
    const current = latestProfileRef.current;
    const res = claimAdNetworkReward(current, network, todayStr, now);
    if ('error' in res) {
      showToast(res.error);
      return;
    }
    playClaimSound(soundsEnabled);
    triggerHapticFeedback('success');
    void persistMutation({
      nextProfile: res.profile,
      transaction: res.transaction,
    });
    showToast(`${res.networkName}: +${res.rewardCoins} coins (${res.watchedToday}/${res.dailyLimit} today)`);
  };

  const handleClaimAdsgramBotJoin = () => {
    const now = Date.now();
    const current = latestProfileRef.current;
    const res = claimAdsgramBotJoinReward(current, todayStr, now);
    if ('error' in res) {
      showToast(res.error);
      return;
    }
    playClaimSound(soundsEnabled);
    triggerHapticFeedback('success');
    triggerRewardConfetti();
    void persistMutation({
      nextProfile: res.profile,
      transaction: res.transaction,
    });
    showToast(
      `AdsGram Bot Joins: +${res.rewardCoins} coins (${res.claimedToday}/${res.dailyLimit} today)`,
    );
  };

  const handleTriggerWatchAd = async () => {
    if (watchingAdLoading) return;
    if (!(await ensureMustJoinVerified('watch ads'))) return;
    setWatchingAdLoading(true);
    setActiveAdNetwork(null);
    setActiveAdAction('watch_ad');
    try {
      const external = await tryRunExternalRewardedAd(adConfig);
      if (external.handled) {
        if (external.rewarded) {
          handleWatchAd();
        } else {
          showToast('Ad closed early — reward not claimed.');
        }
        return;
      }
      setAdModalState({
        open: true,
        kind: 'watch_ad',
        notice: external.message ?? null,
        network: null,
        mandatory: false,
      });
    } finally {
      setWatchingAdLoading(false);
      setActiveAdAction(null);
    }
  };

  const handleTriggerAdNetwork = async (network: AdNetworkId) => {
    if (watchingAdLoading) return;
    if (!(await ensureMustJoinVerified('claim ad rewards'))) return;
    setWatchingAdLoading(true);
    setActiveAdNetwork(network);
    setActiveAdAction('ad_network');
    try {
      const external = await tryRunAdNetwork(network, adConfig);
      if (external.handled) {
        if (external.rewarded) {
          handleClaimAdNetwork(network);
          if (external.message) {
            showToast(external.message);
          }
        } else {
          showToast('Ad closed early — reward not claimed.');
        }
        return;
      }
      setAdModalState({
        open: true,
        kind: 'ad_network',
        notice: external.message ?? null,
        network,
        mandatory: false,
      });
    } finally {
      setWatchingAdLoading(false);
      setActiveAdNetwork(null);
      setActiveAdAction(null);
    }
  };

  const handleTriggerAdsgramTask = async () => {
    if (watchingAdLoading) return;
    if (!(await ensureMustJoinVerified('claim AdsGram rewards'))) return;
    setWatchingAdLoading(true);
    setActiveAdNetwork(null);
    setActiveAdAction('adsgram_task');
    try {
      const external = await tryRunAdsgramTaskAd(adConfig);
      if (external.handled) {
        if (external.rewarded) {
          handleClaimAdsgramBotJoin();
          if (external.message) {
            showToast(external.message);
          }
        } else {
          showToast('Complete the bot join / click task to claim coins.');
        }
        return;
      }
      setAdModalState({
        open: true,
        kind: 'adsgram_task',
        notice: external.message ?? null,
        network: null,
        mandatory: false,
      });
    } finally {
      setWatchingAdLoading(false);
      setActiveAdAction(null);
    }
  };

  const handleUpgradeBasket = () => {
    void (async () => {
      if (!(await ensureMustJoinVerified('upgrade basket'))) return;
      const now = Date.now();
      const res = upgradeBasket(latestProfileRef.current, now);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      playPurchaseSuccessSound(soundsEnabled);
      triggerHapticFeedback('medium');
      void persistMutation({
        nextProfile: res.profile,
        transaction: res.transaction,
      });
      showToast(`Basket upgraded to ${res.profile.basketTierHours}h (${res.profile.basketCapacity} eggs)!`);
    })();
  };

  const handleActivateBooster = () => {
    void (async () => {
      if (!(await ensureMustJoinVerified('activate 2× booster'))) return;
      const now = Date.now();
      const current = latestProfileRef.current;
      const res = activateFeedBooster(current, now);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      playPurchaseSuccessSound(soundsEnabled);
      triggerHapticFeedback('medium');
      void persistMutation({
        nextProfile: res.profile,
        transaction: res.transaction,
      });
      showToast('2× Laying Feed activated for 1 hour!');
    })();
  };

  const handleClaimCoopFeverAd = () => {
    const now = Date.now();
    const updated = recordCoopFeverAd(latestProfileRef.current);
    const nextProg = getCoopFeverProgress(updated, now);
    playClaimSound(soundsEnabled);
    triggerHapticFeedback('success');
    void persistMutation({ nextProfile: updated });
    if (nextProg.ready) {
      triggerRewardConfetti();
      showToast('3× Coop Fever unlocked (25/25 Ads)! Tap Activate 3× Fever on your Farm!');
    } else {
      showToast(
        `3× Fever Ad counted (${nextProg.adsCollected}/${COOP_FEVER_REQUIRED_ADS}).`,
      );
    }
  };

  const handleTriggerCoopFeverAd = async () => {
    if (watchingAdLoading) return;
    if (!(await ensureMustJoinVerified('charge 3× Coop Fever'))) return;
    const now = Date.now();
    const prog = getCoopFeverProgress(latestProfileRef.current, now);
    if (prog.active) {
      showToast('Coop Fever 3× Rush is already active on your farm!');
      return;
    }
    if (prog.ready) {
      handleActivateCoopFever();
      return;
    }
    setWatchingAdLoading(true);
    setActiveAdNetwork(null);
    setActiveAdAction(null);
    try {
      const external = await tryRunExternalRewardedAd(adConfig);
      if (external.handled) {
        if (external.rewarded) {
          handleClaimCoopFeverAd();
        } else {
          showToast('Complete the ad to charge 3× Coop Fever.');
        }
        return;
      }
      setAdModalState({
        open: true,
        kind: 'coop_fever',
        notice: external.message ?? null,
        network: null,
        mandatory: false,
      });
    } finally {
      setWatchingAdLoading(false);
    }
  };

  const handleActivateCoopFever = () => {
    void (async () => {
      if (!(await ensureMustJoinVerified('activate 3× Coop Fever'))) return;
      const now = Date.now();
      const current = latestProfileRef.current;
      const res = activateCoopFever(current, now);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      playGoldenEggSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerRewardConfetti();
      void persistMutation({
        nextProfile: res.profile,
        transaction: res.transaction,
      });
      showToast('Coop Fever 3× Golden Rush activated for 10 minutes!');
    })();
  };

  const handlePurchaseAutoHarvestDrone = (
    durationId: AutoHarvestDurationId,
    currency: AutoHarvestCurrency,
  ) => {
    void (async () => {
      if (!(await ensureMustJoinVerified('deploy Auto-Harvest Drone'))) return;
      const now = Date.now();
      const current = latestProfileRef.current;
      const res = purchaseAutoHarvestDrone(current, durationId, currency, now);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      playPurchaseSuccessSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerRewardConfetti();
      void persistMutation({
        nextProfile: res.profile,
        transaction: res.transaction,
      });
      showToast(`Auto-Harvest Drone active (${res.tier.label})!`);
    })();
  };

  const handleToggleTelegramReminders = useCallback(() => {
    const current = latestProfileRef.current;
    const nextEnabled = current.telegramRemindersEnabled === false;
    const nextProfile: UserFarmProfile = {
      ...current,
      telegramRemindersEnabled: nextEnabled,
    };
    playTabTapSound(soundsEnabled);
    triggerHapticFeedback('selection');
    void persistMutation({ nextProfile });
    showToast(
      nextEnabled
        ? 'Telegram Bot Push Reminders enabled!'
        : 'Telegram Bot Push Reminders paused.',
    );
  }, [persistMutation, showToast, soundsEnabled]);

  // Execute Auto-Harvest Drone automatically when active & basket reaches capacity
  const autoHarvestBusyRef = useRef(false);
  useEffect(() => {
    if (!isPlayerSynced || isBanned || autoHarvestBusyRef.current) return;
    if (mustJoinGateEnabled && !membershipVerified) return;
    const current = latestProfileRef.current;
    const now = Date.now();
    if (!isAutoHarvestDroneActive(current, now)) return;
    const res = applyAutoHarvestIfDue(current, now);
    if (res.autoHarvestedEggs <= 0) return;

    const droneTx: TransactionEntry = {
      id: `tx_autoharvest_${now}`,
      userId: current.uid,
      type: 'auto_harvest',
      title: `Auto-Harvest Drone (+${res.autoHarvestedEggs.toLocaleString()} eggs)`.slice(0, 80),
      amount: res.autoHarvestedEggs,
      currency: 'eggs',
      usdValue: eggsToUsd(res.autoHarvestedEggs),
      status: 'completed',
      createdAtMs: now,
    };

    autoHarvestBusyRef.current = true;
    void persistMutation({
      nextProfile: res.profile,
      transaction: droneTx,
    }).finally(() => {
      autoHarvestBusyRef.current = false;
    });
    showToast(`Auto-Harvest Drone collected +${res.autoHarvestedEggs.toLocaleString()} eggs!`);
  }, [
    isBanned,
    isPlayerSynced,
    membershipVerified,
    mustJoinGateEnabled,
    nowMs,
    persistMutation,
    profile.autoHarvestUntilMs,
    profile.lastCollectedAt,
    showToast,
  ]);

  // Sync Basket Full & Boost Expiry Push Reminders to Telegram Bot server
  const lastReminderSyncKeyRef = useRef<string>('');
  useEffect(() => {
    if (!isPlayerSynced || isBanned) return;
    if (!extractTelegramNumericUserId(profile.uid)) return;
    const initData = getTelegramInitData();
    if (!playerSessionToken && !initData) return;

    const now = Date.now();
    const ratePerHour = calculateProductionRate(profile, now);
    const pending = calculatePendingEggs(profile, now);
    const remainingCapacity = Math.max(0, profile.basketCapacity - pending);
    const cycleDurationMs =
      ratePerHour > 0 ? Math.ceil((profile.basketCapacity / ratePerHour) * 3_600_000) : 0;
    const rawFullAt =
      ratePerHour > 0
        ? remainingCapacity > 0
          ? now + Math.ceil((remainingCapacity / ratePerHour) * 3_600_000)
          : profile.lastCollectedAt > 0 && now - (profile.lastCollectedAt + cycleDurationMs) <= 3.75 * 3_600_000
            ? profile.lastCollectedAt + cycleDurationMs
            : 0
        : 0;
    const basketFullAtMs = rawFullAt > 0 ? Math.floor(rawFullAt / 60_000) * 60_000 : 0;
    const enabled = profile.telegramRemindersEnabled !== false;
    const feedBoostUntilMs = Number(profile.feedBoostUntilMs ?? 0);
    const coopFeverUntilMs = Number(profile.coopFeverUntilMs ?? 0);
    const autoHarvestUntilMs = Number(profile.autoHarvestUntilMs ?? 0);

    const sig = [
      profile.uid,
      enabled ? '1' : '0',
      basketFullAtMs,
      feedBoostUntilMs,
      coopFeverUntilMs,
      autoHarvestUntilMs,
      playerSessionToken ? 'tok' : 'init',
    ].join(':');
    if (lastReminderSyncKeyRef.current === sig) return;

    const timer = window.setTimeout(() => {
      lastReminderSyncKeyRef.current = sig;
      void safeFetchJson('/api/reminders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: profile.uid,
          initData,
          token: playerSessionToken,
          enabled,
          basketFullAtMs,
          feedBoostUntilMs,
          coopFeverUntilMs,
          autoHarvestUntilMs,
        }),
      });
    }, 650);

    return () => window.clearTimeout(timer);
  }, [
    isBanned,
    isPlayerSynced,
    nowMs,
    playerSessionToken,
    profile,
  ]);

  const handleGoldenEggTap = async () => {
    if (isBannedRef.current) {
      showToast('Account blocked — actions are disabled.');
      return;
    }
    if (!(await ensureMustJoinVerified('claim Golden Egg'))) return;
    if (goldenEggClaimInFlightRef.current) {
      return;
    }

    const now = Date.now();
    const current = latestProfileRef.current;
    const latestTxGoldenAt = latestTransactionsRef.current.reduce(
      (maxTs, tx) => (tx.type === 'golden_egg' ? Math.max(maxTs, Number(tx.createdAtMs || 0) || 0) : maxTs),
      0,
    );
    const authoritativeLastAt = Math.max(
      0,
      Number(current.lastGoldenEggAtMs ?? 0) || 0,
      getStoredGoldenEggClaimAtMs(current.uid),
      latestTxGoldenAt,
    );

    const localRemainingMs = getGoldenEggCooldownRemainingMs(
      { lastGoldenEggAtMs: authoritativeLastAt },
      now,
    );
    if (localRemainingMs > 0) {
      setStoredGoldenEggClaimAtMs(current.uid, authoritativeLastAt);
      if (authoritativeLastAt > (current.lastGoldenEggAtMs ?? 0)) {
        const reconciled = { ...current, lastGoldenEggAtMs: authoritativeLastAt };
        latestProfileRef.current = reconciled;
        setProfile(reconciled);
        saveCachedPlayerProfile(reconciled);
      }
      playSoftTapSound(soundsEnabled);
      showToast(`Golden egg recharging (${formatGoldenEggCooldownWait(localRemainingMs)}).`);
      return;
    }

    if (!isPlayerSynced) {
      playSoftTapSound(soundsEnabled);
      showToast('Syncing your farm data — please wait a second...');
      return;
    }

    goldenEggClaimInFlightRef.current = true;
    try {
      await ensurePromiseRef.current;
      const result = await claimGoldenEggInFirestore(
        { ...latestProfileRef.current, lastGoldenEggAtMs: authoritativeLastAt },
        now,
      );

      if (!result.ok) {
        const serverLastAt = Number(result.lastGoldenEggAtMs ?? 0) || 0;
        if (serverLastAt > 0) {
          setStoredGoldenEggClaimAtMs(current.uid, serverLastAt);
          if (serverLastAt > (latestProfileRef.current.lastGoldenEggAtMs ?? 0)) {
            const synced = { ...latestProfileRef.current, lastGoldenEggAtMs: serverLastAt };
            latestProfileRef.current = synced;
            setProfile(synced);
            saveCachedPlayerProfile(synced);
          }
        }
        playSoftTapSound(soundsEnabled);
        showToast(result.error);
        return;
      }

      const claimedAt = Number(result.profile.lastGoldenEggAtMs ?? now) || now;
      setStoredGoldenEggClaimAtMs(result.profile.uid, claimedAt);
      latestProfileRef.current = result.profile;
      setProfile(result.profile);
      saveCachedPlayerProfile(result.profile);
      setTransactions((prev) => {
        if (prev.some((t) => t.id === result.transaction.id)) return prev;
        return [result.transaction, ...prev].slice(0, 60);
      });

      playGoldenEggSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerGoldenEggConfetti();
      showToast(`Golden Egg! +${result.bonusCoins} coins & +${result.xpGained} XP`);
    } catch (err) {
      showToast(
        formatSyncErrorMessage(err, 'Could not verify Golden Egg cooldown — check connection and retry.'),
      );
    } finally {
      goldenEggClaimInFlightRef.current = false;
    }
  };

  const handleClaimAchievement = (achievementId: string) => {
    void (async () => {
      if (!(await ensureMustJoinVerified('claim achievement'))) return;
      const now = Date.now();
      const current = latestProfileRef.current;
      const res = claimAchievement(current, achievementId, now);
      if ('error' in res) {
        showToast(res.error);
        return;
      }
      playClaimSound(soundsEnabled);
      triggerHapticFeedback('success');
      triggerRewardConfetti();
      void persistMutation({
        nextProfile: res.profile,
        transaction: res.transaction,
      });
      showToast(`${res.title} claimed: +${res.rewardCoins} coins!`);
    })();
  };

  const handleChangeLanguage = (language: LanguageCode) => {
    userSelectedLangRef.current = language;
    setStoredLanguage(language, profile.uid);
    const nextProfile: UserFarmProfile = { ...latestProfileRef.current, language };
    void persistMutation({ nextProfile });
  };

  const navigateTab = (tab: NavTab) => {
    playTabTapSound(soundsEnabled);
    triggerHapticFeedback('selection');
    setSubView('none');
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const openSubView = (view: SubView) => {
    playTabTapSound(soundsEnabled);
    triggerHapticFeedback('selection');
    setSubView(view);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const renderContextualPanel = () => {
    if (subView === 'profile') {
      return (
        <ProfileView
          key={profile.uid}
          profile={profile}
          isTelegramDetected={detectedIdentity.isTelegramDetected}
          extraAdminIds={extraAdminIds}
          onBack={() => setSubView('none')}
          onBuyChickens={() => {
            setSubView('none');
            setActiveTab('packs');
          }}
          onOpenSettings={() => setShowSettings(true)}
          onOpenAdmin={() => openSubView('admin')}
          onClaimAchievement={handleClaimAchievement}
        />
      );
    }

    if (subView === 'admin') {
      return (
        <AdminPanelView
          playerId={detectedIdentity.playerId || profile.uid}
          adminUnlocked={adminUnlocked}
          adminSessionToken={adminSessionToken}
          adminPasscodeSource={adminPasscodeSource}
          adminPasscodeUpdatedAtMs={adminPasscodeUpdatedAtMs}
          adminNeedsPasscodeSetup={adminNeedsPasscodeSetup}
          serverBotConfigured={serverBotConfigured}
          onVerifyAdminPasscode={handleVerifyAdminPasscode}
          onSetupInitialAdminPasscode={handleSetupInitialAdminPasscode}
          onTestChannels={handleTestChannelsDiagnostic}
          channelDiagnosticLogs={channelDiagnosticLogs}
          loadingChannelLogs={loadingChannelLogs}
          channelLogsError={channelLogsError}
          onRefreshChannelLogs={handleFetchChannelDiagnosticLogs}
          systemDiagnostics={systemDiagnostics}
          loadingSystemDiagnostics={loadingSystemDiagnostics}
          systemDiagnosticsError={systemDiagnosticsError}
          onFetchSystemDiagnostics={handleFetchSystemDiagnostics}
          onLockAdmin={handleLockAdmin}
          withdrawRequests={allWithdrawRequests}
          customTasks={customTasks}
          adConfig={adConfig}
          channelsConfig={channelsConfig}
          promoCodes={promoCodes}
          recentPlayers={recentPlayers}
          bannedUsers={bannedUsers}
          adminsConfig={adminsConfig}
          withdrawApproveTemplate={withdrawApproveTemplate}
          onSaveWithdrawApproveTemplate={handleSaveWithdrawApproveTemplate}
          onTabTap={() => playTabTapSound(soundsEnabled)}
          onBack={() => setSubView('none')}
          onReviewWithdrawal={handleReviewWithdrawal}
          onCreateTask={handleCreateCustomTask}
          onToggleTask={handleToggleCustomTask}
          onDeleteTask={handleDeleteCustomTask}
          onSaveAdConfig={handleSaveAdConfig}
          onSaveChannelsConfig={handleSaveChannelsConfig}
          onSyncChannels={handleSyncChannelsWithBot}
          onCreatePromoCode={handleCreatePromoCode}
          onTogglePromoCode={handleTogglePromoCode}
          onDeletePromoCode={handleDeletePromoCode}
          onBanPlayer={handleBanPlayer}
          onUnbanPlayer={handleUnbanPlayer}
          onSearchUsers={handleSearchUsers}
          onFetchPlayerReferrals={handleFetchPlayerReferrals}
          onAdjustCoins={handleAdjustCoins}
          onAdjustReferralCount={handleAdjustReferralCount}
          onAddReferralRelation={handleAddReferralRelation}
          onRemoveReferralRelation={handleRemoveReferralRelation}
          onAddAdmin={handleAddAdmin}
          onRemoveAdmin={handleRemoveAdmin}
          onFetchBroadcastStats={handleFetchBroadcastStats}
          onSyncBotSubscribers={handleSyncBotSubscribers}
          onSendBroadcast={handleSendBroadcast}
          botConfigStatus={botConfigStatus}
          onSaveBotToken={handleSaveBotToken}
          onClearBotToken={handleClearBotToken}
          onAdjustWithdrawAds={handleAdjustWithdrawAds}
          taskPricingConfig={taskPricingConfig}
          onSaveTaskPricingConfig={handleSaveTaskPricingConfig}
          economyConfig={economyConfig}
          onSaveEconomyConfig={handleSaveEconomyConfig}
          systemResetConfig={systemResetConfig}
          onExecuteDataReset={handleExecuteDataReset}
          maintenanceConfig={maintenanceConfig}
          onSaveMaintenanceConfig={handleSaveMaintenanceConfig}
        />
      );
    }

    if (subView === 'your_farm') {
      return (
        <YourFarmView
          profile={profile}
          pendingEggs={pendingEggs}
          telegramRemindersEnabled={profile.telegramRemindersEnabled !== false}
          onBack={() => setSubView('none')}
          onUpgradeBasket={handleUpgradeBasket}
          onGoPacks={() => {
            setSubView('none');
            setActiveTab('packs');
          }}
          onOpenWithdraw={() => openSubView('withdraw')}
          onToggleTelegramReminders={handleToggleTelegramReminders}
          onActivateBooster={handleActivateBooster}
          onPurchaseAutoHarvestDrone={handlePurchaseAutoHarvestDrone}
        />
      );
    }

    if (subView === 'deposit') {
      return (
        <DepositView
          profile={profile}
          deposits={deposits}
          depositAddress={depositAddress}
          gramJettonMaster={gramJettonMaster}
          onBack={() => setSubView('none')}
          onViewWallet={() => {
            setSubView('none');
            setActiveTab('wallet');
          }}
          onAutoCreditGramDeposit={handleAutoCreditGramDeposit}
        />
      );
    }

    if (subView === 'withdraw') {
      return (
        <WithdrawView
          profile={profile}
          withdrawals={withdrawals}
          minWithdrawEggs={economyConfig.minWithdrawEggs}
          channelVerification={channelVerification}
          requiredChannels={activeRequiredChannels}
          channelsGateEnabled={channelsGateEnabled}
          checkingChannels={checkingChannels}
          channelCheckError={channelCheckError}
          onCheckChannels={() => void handleCheckChannels()}
          onRetryCheckChannels={() => void handleCheckChannels()}
          onBack={() => setSubView('none')}
          onGoToTasks={() => {
            setSubView('none');
            setActiveTab('tasks');
          }}
          onConfirmWithdraw={handleConfirmWithdraw}
        />
      );
    }

    if (activeTab === 'packs') {
      return (
        <PacksView
          profile={profile}
          buyingBusy={watchingAdLoading}
          onBuy={handleBuyChickens}
          onTopUp={() => setSubView('deposit')}
        />
      );
    }

    if (activeTab === 'leaderboard') {
      return (
        <LeaderboardView
          profile={profile}
          entries={leaderboardEntries}
          seasonConfig={seasonConfig}
          onTabTap={() => playTabTapSound(soundsEnabled)}
          onNavigateFriends={() => navigateTab('friends')}
          onNavigatePacks={() => navigateTab('packs')}
        />
      );
    }

    if (activeTab === 'tasks') {
      return (
        <TasksView
          profile={profile}
          todayStr={todayStr}
          customTasks={customTasks}
          adConfig={adConfig}
          payoutChannelUrl={liveTaskChannelLinks.payoutChannelUrl}
          getCodeChannelUrl={
            liveTaskChannelLinks.giftCodeChannelUrl || DEFAULT_GET_CODE_CHANNEL_URL
          }
          botUsername={telegramBotConfig?.botUsername ?? botConfigStatus?.botUsername ?? null}
          taskPricingConfig={taskPricingConfig}
          economyConfig={economyConfig}
          nowMs={nowMs}
          watchingAd={watchingAdLoading}
          activeAdNetwork={activeAdNetwork}
          activeAdAction={activeAdAction}
          channelVerification={channelVerification}
          requiredChannels={activeRequiredChannels}
          channelsGateEnabled={channelsGateEnabled}
          checkingChannels={checkingChannels}
          channelCheckError={channelCheckError}
          onCheckChannels={() => handleCheckChannels()}
          onRetryCheckChannels={() => handleCheckChannels()}
          onVerifyTaskChannel={handleVerifyTaskChannel}
          onTabTap={() => playTabTapSound(soundsEnabled)}
          onClaimPromo={handleClaimPromo}
          onClaimDaily={handleClaimDaily}
          onCompleteTask={handleCompleteTask}
          onTriggerWatchAd={() => void handleTriggerWatchAd()}
          onTriggerAdNetwork={(net) => void handleTriggerAdNetwork(net)}
          onTriggerAdsgramTask={() => void handleTriggerAdsgramTask()}
          onOpenDeposit={() => openSubView('deposit')}
          onOpenReinvest={() => setShowReinvestModal(true)}
          onCreateTask={handleCreatePaidUserTask}
          onTopUpTask={handleTopUpTask}
          onRefundTask={handleRefundTask}
          onRefreshTasks={handleRefreshTasks}
        />
      );
    }

    if (activeTab === 'friends') {
      return (
        <FriendsView
          profile={profile}
          referrals={mergedReferrals}
          transactions={mergedReferralTransactions}
          perReferRewardCoins={economyConfig.perReferRewardCoins}
          botUsername={telegramBotConfig.botUsername}
          appShortName={telegramBotConfig.appShortName}
        />
      );
    }

    if (activeTab === 'wallet') {
      return (
        <WalletView
          profile={profile}
          transactions={transactions}
          withdrawals={withdrawals}
          economyConfig={economyConfig}
          nowMs={nowMs}
          onTabTap={() => playTabTapSound(soundsEnabled)}
          onOpenDeposit={() => setSubView('deposit')}
          onOpenWithdraw={() => setSubView('withdraw')}
          onOpenReinvest={() => setShowReinvestModal(true)}
          onReinvest={(eggsAmount) => void handleStartReinvestWithAd(eggsAmount)}
        />
      );
    }

    // Desktop right-column overview when Farm tab is active
    const productionRate = calculateProductionRate(profile);
    return (
      <div className="space-y-4">
        <div className="clay-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="alpha-brand-crest w-11 h-11 rounded-2xl text-base font-extrabold flex items-center justify-center shrink-0">
                αG
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 truncate">
                  Alpha Gram Overview
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Live Cloud Sync · User ID{' '}
                  <span className="font-mono-num font-bold text-stone-700 dark:text-stone-200">
                    {getPrimaryDepositMemo(profile.uid)}
                  </span>
                </p>
              </div>
            </div>
            <span className="clay-card-mint !rounded-xl inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 px-3 py-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cloud Synced</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="clay-card-warm clay-hover-lift !rounded-2xl p-3">
              <div className="text-xs font-bold text-stone-500 dark:text-stone-400">Production</div>
              <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100 font-mono-num mt-0.5">
                {productionRate} /h
              </div>
            </div>
            <div className="clay-card-mint clay-hover-lift !rounded-2xl p-3">
              <div className="text-xs font-bold text-stone-500 dark:text-stone-400">Referrals</div>
              <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100 font-mono-num mt-0.5 flex items-center gap-1">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{profile.referralCount}</span>
              </div>
            </div>
            <div className="clay-inset clay-hover-lift !rounded-2xl p-3">
              <div className="text-xs font-bold text-stone-500 dark:text-stone-400">Ref Rewards</div>
              <div className="text-lg font-extrabold text-stone-900 dark:text-stone-100 font-mono-num mt-0.5 flex items-center gap-1">
                <CoinIcon className="w-4 h-4 shrink-0" />
                <span>+{profile.referralCoinsEarned.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigateTab('packs')}
              className="clay-btn clay-btn-amber min-h-[44px] rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>Buy Hens</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => openSubView('deposit')}
              className="clay-btn clay-btn-emerald min-h-[44px] rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{strings.deposit}</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => openSubView('withdraw')}
              className="clay-btn clay-btn-sky min-h-[44px] rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{strings.withdraw}</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => navigateTab('friends')}
              className="clay-btn clay-btn-neutral min-h-[44px] rounded-2xl text-stone-800 dark:text-stone-100 font-extrabold text-xs flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{strings.friends}</span>
            </motion.button>
          </div>
        </div>

        {/* Desktop Preview: Referral Program + Recent Transactions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="clay-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Referral Rewards</span>
              </h3>
              <button
                type="button"
                onClick={() => navigateTab('friends')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Invite
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="clay-card-mint !rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-stone-700 dark:text-stone-200">On Friend's 1st Hen</span>
                <span className="font-extrabold font-mono-num text-emerald-700 dark:text-emerald-300">
                  +{economyConfig.perReferRewardCoins.toLocaleString()} Coins
                </span>
              </div>
              <div className="clay-card-warm !rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-stone-700 dark:text-stone-200">Lifetime Deposit Share</span>
                <span className="font-extrabold font-mono-num text-amber-700 dark:text-amber-300">
                  {Math.round(REFERRAL_DEPOSIT_COMMISSION_RATE * 100)}% Commission
                </span>
              </div>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold">
                Telegram Bot alerts on every 1st-hen referral unlock &amp; lifetime 5% deposit commission.
              </div>
            </div>
          </div>

          <div className="clay-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Recent Activity</span>
              </h3>
              <button
                type="button"
                onClick={() => navigateTab('wallet')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Wallet
              </button>
            </div>
            <div className="space-y-2">
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-stone-700 dark:text-stone-300 truncate">{tx.title}</span>
                  <span
                    className={`font-extrabold font-mono-num flex items-center gap-1 shrink-0 ${
                      tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                    {tx.currency === 'eggs' ? (
                      <EggIcon className="w-3.5 h-3.5" />
                    ) : (
                      <CoinIcon className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const showFarmOnMobile = activeTab === 'farm' && subView === 'none';

  const hideBottomNav = subView === 'profile' || subView === 'admin';

  if (isBanned && banRecord) {
    const displayUserId = getUnifiedUserId(banRecord.uid || profile.uid);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-stone-900 dark:text-stone-100">
        <div className="clay-card max-w-md w-full overflow-hidden">
          <div className="bg-stone-900 dark:bg-stone-950 border-b border-stone-800 px-5 py-4 text-white flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5 text-rose-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight">Account Blocked</h1>
              <p className="text-xs text-stone-300">Access to all Alpha Gram features is suspended</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold text-stone-600 dark:text-stone-300 leading-relaxed">
              Your account has been restricted by an administrator. Farm mining, shop purchases,
              tasks, referrals, and withdrawals are disabled while this block is active.
            </p>

            <div className="clay-inset !rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-stone-500 dark:text-stone-400">Blocked User ID / UID</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(displayUserId).catch(() => {});
                    setBanIdCopied(true);
                    window.setTimeout(() => setBanIdCopied(false), 1600);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-stone-200/80 dark:bg-stone-800 px-2 py-1 font-mono-num font-extrabold text-stone-900 dark:text-stone-100 cursor-pointer"
                >
                  <span>{displayUserId}</span>
                  {banIdCopied ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-70" />
                  )}
                </button>
              </div>
              {banRecord.bannedAtMs > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-stone-500 dark:text-stone-400">Blocked On</span>
                  <span className="font-mono-num font-semibold text-stone-700 dark:text-stone-300">
                    {new Date(banRecord.bannedAtMs).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 px-3.5 py-3 space-y-1">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Reason
              </div>
              <div className="text-xs font-bold text-rose-900 dark:text-rose-200 break-words">
                {banRecord.reason || 'Blocked by Administrator'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMaintenanceBlocked) {
    return (
      <MaintenanceScreen
        config={maintenanceConfig}
        playerId={detectedIdentity.playerId || profile.uid || activePlayerId}
        isAuthorizedAdmin={isAuthorizedAdmin}
        onOpenAdminPanel={
          isAuthorizedAdmin
            ? () => {
                playTabTapSound(soundsEnabled);
                triggerHapticFeedback('selection');
                setSubView('admin');
                window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
              }
            : undefined
        }
        onRefresh={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
    );
  }

  return (
    <div
      className={`${
        showFarmOnMobile
          ? 'min-h-[100dvh] lg:min-h-screen flex flex-col lg:block pb-0 lg:pb-22'
          : `min-h-screen ${hideBottomNav ? 'pb-6' : 'pb-22'}`
      } text-stone-900 dark:text-stone-100 transition-colors`}
    >
      <TopBar
        profile={profile}
        coinsLabel={strings.coins}
        eggsLabel={strings.eggs}
        isAllMuted={allAudioMuted}
        muteAllLabel={strings.muteAll}
        unmuteAllLabel={strings.unmuteAll}
        isAdmin={isAuthorizedAdmin}
        isLeaderboardActive={activeTab === 'leaderboard' && subView === 'none'}
        ranksLabel={strings.ranks}
        onOpenProfile={() => openSubView('profile')}
        onOpenAdmin={() => openSubView('admin')}
        onToggleMuteAll={handleToggleMuteAll}
        onToggleLeaderboard={() => {
          playTabTapSound(soundsEnabled);
          if (activeTab === 'leaderboard' && subView === 'none') {
            setActiveTab('farm');
          } else {
            setSubView('none');
            setActiveTab('leaderboard');
          }
        }}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDeposit={() => openSubView('deposit')}
      />

      {maintenanceConfig.enabled && isAuthorizedAdmin && adminUnlocked && subView !== 'admin' && (
        <div className="max-w-6xl mx-auto px-3 sm:px-5 pt-2">
          <div className="clay-card-warm !rounded-2xl border border-amber-300/80 dark:border-amber-700/60 px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-amber-900 dark:text-amber-200 truncate">
              Maintenance Mode is ON (Admin Preview Mode)
            </span>
            <button
              type="button"
              onClick={() => openSubView('admin')}
              className="clay-btn clay-btn-amber px-2.5 py-1 rounded-xl text-[11px] font-extrabold shrink-0"
            >
              Admin Panel
            </button>
          </div>
        </div>
      )}

      {/* Unified non-overlapping Clay Feedback Toast */}
      <AnimatePresence>
        {toastText && (
          <motion.div
            key={toastText}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 440, damping: 28 }}
            className="clay-card-dark fixed bottom-20 left-1/2 -translate-x-1/2 z-50 !rounded-2xl text-white px-4 py-2.5 text-xs sm:text-sm font-bold whitespace-nowrap flex items-center gap-2 shadow-2xl"
          >
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={
          showFarmOnMobile
            ? 'w-full flex-1 flex flex-col lg:block lg:max-w-6xl lg:mx-auto lg:px-5 lg:pt-5'
            : 'max-w-6xl mx-auto px-3 sm:px-5 pt-3 sm:pt-5'
        }
      >
        <div
          className={
            showFarmOnMobile
              ? 'flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start'
              : 'grid grid-cols-1 lg:grid-cols-12 gap-5 items-start'
          }
        >
          {/* Left / Primary Farm Stage */}
          <div
            className={`lg:col-span-5 lg:sticky lg:top-32 ${
              showFarmOnMobile ? 'flex-1 flex flex-col w-full lg:block' : 'hidden lg:block'
            }`}
          >
            <FarmMeadow
              profile={profile}
              pendingEggs={pendingEggs}
              collectLabel={strings.collect}
              economyConfig={economyConfig}
              isVisible={showFarmOnMobile}
              isProfileSynced={isPlayerSynced}
              onCollect={handleCollectEggs}
              onOpenYourFarm={() => openSubView('your_farm')}
              onOpenWithdraw={() => openSubView('withdraw')}
              onOpenReinvest={() => setShowReinvestModal(true)}
              onChickenTap={() => {
                playChickenCluckSound(soundsEnabled);
                triggerHapticFeedback('light');
              }}
              onGoldenEggDrop={handleGoldenEggTap}
              onActivateBooster={handleActivateBooster}
              onActivateCoopFever={handleActivateCoopFever}
              onWatchCoopFeverAd={() => void handleTriggerCoopFeverAd()}
              onBuyChickens={() => navigateTab('packs')}
            />
          </div>

          {/* Right / Active Workspace View */}
          <div className={`lg:col-span-7 ${showFarmOnMobile ? 'hidden lg:block' : 'block'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={subView !== 'none' ? `sub-${subView}` : `tab-${activeTab}`}
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderContextualPanel()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {!hideBottomNav && (
        <BottomNav
          activeTab={activeTab}
          hasClaimableTasks={hasClaimableTasks}
          labels={{
            farm: strings.farm,
            packs: strings.packs,
            tasks: strings.tasks,
            friends: strings.friends,
            wallet: strings.wallet,
          }}
          onSelectTab={navigateTab}
        />
      )}

      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {!showSplash && !adModalState.open && showSignUpBonusModal && (
        <SignUpBonusModal
          hasReferral={Boolean(profile.referredBy || pendingRefCode)}
          onClaim={() => {
            playClaimSound(soundsEnabled);
            triggerRewardConfetti();
            triggerHapticFeedback('success');
            setShowSignUpBonusModal(false);
            try {
              localStorage.setItem(`chickenland_signup_bonus_seen_${activePlayerId}`, '1');
            } catch {
              // ignore storage errors
            }
            showToast(
              `+${SIGNUP_BONUS_COINS.toLocaleString()} coins claimed! Buy your first chicken in Packs to start mining.`,
            );
          }}
        />
      )}

      {!showSplash && !adModalState.open && showWelcomeModal && !showSignUpBonusModal && (
        <WelcomeBackModal
          pendingEggs={pendingEggs}
          awayLabel={formatAwayDuration(nowMs - profile.lastCollectedAt)}
          onCollect={handleCollectEggs}
          onDismiss={() => setShowWelcomeModal(false)}
          headingText={strings.welcomeBack}
          collectLabel={strings.collect}
        />
      )}

      {!showSplash &&
        !adModalState.open &&
        !showSignUpBonusModal &&
        channelsGateEnabled &&
        showChannelGateModal && (
          <ChannelCheckModal
            verification={channelVerification}
            requiredChannels={activeRequiredChannels}
            checking={checkingChannels}
            checkError={channelCheckError}
            pendingPromoCode={pendingPromoClaimCode}
            mustJoinRequired={mustJoinGateEnabled}
            onCheckChannels={() => void handleCheckChannels()}
            onRetryCheck={() => void handleCheckChannels()}
            onClose={() => {
              pendingPromoClaimCodeRef.current = null;
              setPendingPromoClaimCode(null);
              setShowChannelGateModal(false);
            }}
          />
        )}

      {adModalState.open && (() => {
        const netDef = adModalState.network
          ? AD_NETWORK_TASKS.find((n) => n.id === adModalState.network)
          : null;
        return (
          <RewardedAdModal
            adConfig={adConfig}
            watchedCount={profile.watchedAdsCount}
            actionKind={adModalState.kind}
            networkLabel={netDef?.name ?? null}
            rewardCoins={
              adModalState.kind === 'adsgram_task'
                ? ADSGRAM_BOT_JOIN_TASK.rewardCoins
                : (netDef?.rewardCoins ?? null)
            }
            pendingEggs={adModalState.pendingEggs ?? null}
            promoCode={adModalState.promoCode ?? null}
            promoRewardSummary={adModalState.promoRewardSummary ?? null}
            chickenBreed={adModalState.chickenBreed ?? null}
            chickenQty={adModalState.chickenQty ?? null}
            minerCostCoins={adModalState.minerCostCoins ?? null}
            reinvestEggs={adModalState.reinvestEggs ?? null}
            reinvestCoins={adModalState.reinvestCoins ?? null}
            reinvestBonusPercent={adModalState.reinvestBonusPercent ?? null}
            coopFeverAdsCollected={getCoopFeverProgress(profile, nowMs).adsCollected}
            coopFeverAdsRequired={COOP_FEVER_REQUIRED_ADS}
            fallbackNotice={adModalState.notice}
            mandatory={adModalState.mandatory}
            onComplete={() => {
              const currentModal = adModalState;
              setAdModalState({ open: false, kind: 'watch_ad', notice: null, network: null });
              if (currentModal.kind === 'startup') {
                const updated = recordCompletedGateAd(latestProfileRef.current);
                void persistMutation({ nextProfile: updated });
                playSoftTapSound(soundsEnabled);
              } else if (currentModal.kind === 'collect_eggs') {
                executeCollectEggs(true);
              } else if (currentModal.kind === 'claim_promo' && currentModal.promoCode) {
                void handleAfterPromoAdCompleted(currentModal.promoCode);
              } else if (currentModal.kind === 'buy_chicken' && currentModal.chickenBreed) {
                void executeBuyChickens(
                  currentModal.chickenBreed,
                  currentModal.chickenQty || 1,
                  true,
                );
              } else if (currentModal.kind === 'reinvest' && currentModal.reinvestEggs) {
                executeReinvest(currentModal.reinvestEggs);
              } else if (currentModal.kind === 'ad_network' && currentModal.network) {
                handleClaimAdNetwork(currentModal.network);
              } else if (currentModal.kind === 'adsgram_task') {
                handleClaimAdsgramBotJoin();
              } else if (currentModal.kind === 'coop_fever') {
                handleClaimCoopFeverAd();
              } else {
                handleWatchAd();
              }
            }}
            onClose={() => {
              if (adModalState.mandatory) return;
              const cancelledKind = adModalState.kind;
              setAdModalState({ open: false, kind: 'watch_ad', notice: null, network: null });
              if (cancelledKind === 'collect_eggs') {
                showToast('Ad cancelled — eggs were not collected.');
              } else if (cancelledKind === 'claim_promo') {
                showToast('Ad cancelled — gift code was not claimed.');
              } else if (cancelledKind === 'buy_chicken') {
                showToast('Ad cancelled — miner was not purchased.');
              } else if (cancelledKind === 'reinvest') {
                showToast('Ad cancelled — reinvest was not completed.');
              } else {
                showToast('Ad closed early — reward not claimed.');
              }
            }}
          />
        );
      })()}

      {showReinvestModal && (
        <ReinvestModal
          availableEggs={profile.eggs}
          economyConfig={economyConfig}
          nowMs={nowMs}
          loading={watchingAdLoading}
          onInvest={(eggsAmount) => void handleStartReinvestWithAd(eggsAmount)}
          onClose={() => setShowReinvestModal(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          currentLanguage={profile.language}
          musicEnabled={musicEnabled}
          soundsEnabled={soundsEnabled}
          telegramRemindersEnabled={profile.telegramRemindersEnabled !== false}
          themeMode={themeMode}
          onChangeLanguage={handleChangeLanguage}
          onToggleMusic={handleToggleMusic}
          onToggleSounds={handleToggleSounds}
          onToggleTelegramReminders={handleToggleTelegramReminders}
          onToggleTheme={handleToggleTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
      <OfflineIndicator />
    </div>
  );
}
