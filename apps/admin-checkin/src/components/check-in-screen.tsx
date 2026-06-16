import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import type { StyleProp, TextInputProps, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Camera,
  Crown,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Keyboard,
  LogOut,
  Mail,
  NotebookPen,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  TicketCheck,
  Undo2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import {
  ApiError,
  checkInTicket,
  createWalkUp,
  fetchAttendees,
  fetchCheckInContext,
  hasApiConfig,
  searchCheckInGuests,
} from "@/lib/api";
import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import type {
  CheckInLookupResult,
  CheckInResult,
  EventDaySummary,
  EventAttendeeSummary,
  EventSummary,
  SessionSummary,
  TicketTypeSummary,
  WalkUpCheckInResult,
  WalkUpFormState,
} from "@/lib/types";

const colors = {
  background: "#05070c",
  backgroundAlt: "#0b1020",
  panel: "#0f1724",
  panelAlt: "#151f31",
  panelElevated: "#182235",
  border: "#263348",
  text: "#f8fbff",
  muted: "#97a3b6",
  soft: "#d9e4f2",
  accent: "#2dd4bf",
  accentDark: "#0f766e",
  indigo: "#6366f1",
  indigoDark: "#4338ca",
  danger: "#fb7185",
  green: "#34d399",
  amber: "#fbbf24",
  blue: "#7dd3fc",
  red: "#2dd4bf",
  redDark: "#0f766e",
};

const emptyWalkUpForm: WalkUpFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  roleTitle: "",
  ticketTypeId: "",
  paymentMode: "cash",
};

const rememberMeKey = "fcf-checkin-remember-me";
const rememberedEmailKey = "fcf-checkin-email";

export function CheckInScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [eventDays, setEventDays] = useState<EventDaySummary[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeSummary[]>([]);
  const [eventId, setEventId] = useState("");
  const [eventDayId, setEventDayId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [contextLoaded, setContextLoaded] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [ticketCode, setTicketCode] = useState("");
  const [result, setResult] = useState<CheckInResult | WalkUpCheckInResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [attendees, setAttendees] = useState<EventAttendeeSummary[]>([]);
  const [attendeeFilter, setAttendeeFilter] = useState<"all" | "checked_in" | "not_checked_in">("all");
  const [attendeeQuery, setAttendeeQuery] = useState("");
  const [isRefreshingAttendees, setIsRefreshingAttendees] = useState(false);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<CheckInLookupResult[]>([]);
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [walkUp, setWalkUp] = useState<WalkUpFormState>(emptyWalkUpForm);
  const [isAddingWalkUp, setIsAddingWalkUp] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const resultPulse = useRef(new Animated.Value(0)).current;

  const token = session?.access_token ?? null;
  const selectedEvent = useMemo(() => events.find((event) => event.id === eventId) ?? null, [eventId, events]);
  const eventDayOptions = useMemo(() => eventDays.filter((item) => item.event_id === eventId), [eventDays, eventId]);
  const selectedEventDay = useMemo(() => eventDayOptions.find((item) => item.id === eventDayId) ?? null, [eventDayId, eventDayOptions]);
  const eventSessions = useMemo(
    () => sessions.filter((item) => item.event_id === eventId && (!eventDayId || !item.event_day_id || item.event_day_id === eventDayId)),
    [eventDayId, eventId, sessions],
  );
  const eventTicketTypes = useMemo(() => ticketTypes.filter((item) => item.event_id === eventId), [eventId, ticketTypes]);
  const selectedSession = useMemo(
    () => eventSessions.find((item) => item.id === sessionId) ?? null,
    [eventSessions, sessionId],
  );
  const checkedInCount = useMemo(
    () => attendees.filter((attendee) => Boolean(attendee.checked_in_at)).length,
    [attendees],
  );
  const visibleAttendees = useMemo(() => {
    const query = attendeeQuery.trim().toLowerCase();

    return attendees.filter((attendee) => {
      const statusMatches =
        attendeeFilter === "all" ||
        (attendeeFilter === "checked_in" && attendee.checked_in_at) ||
        (attendeeFilter === "not_checked_in" && !attendee.checked_in_at);

      if (!statusMatches) return false;
      if (!query) return true;

      return [
        attendee.full_name,
        attendee.email,
        attendee.phone,
        attendee.company,
        attendee.ticket_code,
        attendee.ticket_type_name,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [attendeeFilter, attendeeQuery, attendees]);

  const loadContext = useCallback(async (nextToken: string | null) => {
    setIsLoadingContext(true);
    setContextMessage(null);

    try {
      const data = await fetchCheckInContext(nextToken);
      setEvents(data.events);
      setEventDays(data.eventDays);
      setSessions(data.sessions);
      setTicketTypes(data.ticketTypes);
      setAttendees(data.initialAttendees);
      setEventId(data.events[0]?.id ?? "");
      setEventDayId(data.eventDays.find((day) => day.event_id === data.events[0]?.id)?.id ?? "");
      setSessionId("");
      setContextLoaded(true);
      setContextMessage(data.message ?? null);
    } catch (error) {
      setContextLoaded(false);
      setContextMessage(messageFromError(error));
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  const refreshAttendees = useCallback(
    async (targetEventId = eventId, targetEventDayId = eventDayId, targetSessionId = sessionId) => {
      if (!targetEventId || !targetEventDayId) {
        setAttendees([]);
        return;
      }

      setIsRefreshingAttendees(true);
      try {
        const data = await fetchAttendees(token, {
          eventId: targetEventId,
          eventDayId: targetEventDayId,
          sessionId: targetSessionId || null,
        });
        setAttendees(data.attendees);
        setStatusMessage(data.message ?? null);
      } catch (error) {
        setStatusMessage(messageFromError(error));
        setAttendees([]);
      } finally {
        setIsRefreshingAttendees(false);
      }
    },
    [eventDayId, eventId, sessionId, token],
  );

  useEffect(() => {
    let mounted = true;

    if (!hasSupabaseConfig || !supabase) {
      setAuthReady(true);
      return undefined;
    }

    async function prepareAuth() {
      try {
        const [savedRememberMe, savedEmail, sessionResult] = await Promise.all([
          SecureStore.getItemAsync(rememberMeKey),
          SecureStore.getItemAsync(rememberedEmailKey),
          supabase!.auth.getSession(),
        ]);

        if (!mounted) return;

        const shouldRemember = savedRememberMe !== "false";
        setRememberMe(shouldRemember);
        if (savedEmail) setEmail(savedEmail);

        if (shouldRemember) {
          setSession(sessionResult.data.session);
        } else {
          if (sessionResult.data.session) await supabase!.auth.signOut();
          if (mounted) setSession(null);
        }
      } finally {
        if (mounted) setAuthReady(true);
      }
    }

    void prepareAuth();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authReady && session && !contextLoaded && !isLoadingContext) {
      void loadContext(session.access_token);
    }
  }, [authReady, contextLoaded, isLoadingContext, loadContext, session]);

  useEffect(() => {
    if (contextLoaded && eventId) {
      void refreshAttendees(eventId, eventDayId, sessionId);
    }
  }, [contextLoaded, eventDayId, eventId, refreshAttendees, sessionId]);

  useEffect(() => {
    if (eventDayId && eventDayOptions.some((day) => day.id === eventDayId)) return;
    setEventDayId(eventDayOptions[0]?.id ?? "");
  }, [eventDayId, eventDayOptions]);

  useEffect(() => {
    if (!sessionId) return;
    if (eventSessions.some((sessionItem) => sessionItem.id === sessionId)) return;
    setSessionId("");
  }, [eventSessions, sessionId]);

  useEffect(() => {
    setWalkUp((current) => {
      if (eventTicketTypes.some((ticketType) => ticketType.id === current.ticketTypeId)) return current;
      return {
        ...current,
        ticketTypeId: eventTicketTypes[0]?.id ?? "",
      };
    });
  }, [eventTicketTypes]);

  useEffect(() => {
    if (!result) return;

    resultPulse.setValue(0);
    Animated.timing(resultPulse, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [result, resultPulse]);

  async function signIn() {
    if (!supabase) return;
    setIsSigningIn(true);
    setAuthMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (error) {
        setAuthMessage(error.message);
        return;
      }

      await SecureStore.setItemAsync(rememberMeKey, rememberMe ? "true" : "false");
      if (rememberMe) {
        await SecureStore.setItemAsync(rememberedEmailKey, email.trim().toLowerCase());
      } else {
        await SecureStore.deleteItemAsync(rememberedEmailKey);
      }

      setSession(data.session);
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setSession(null);
    setDemoMode(false);
    setContextLoaded(false);
    setEvents([]);
    setEventDays([]);
    setSessions([]);
    setTicketTypes([]);
    setAttendees([]);
    setResult(null);
    setCameraActive(false);
    setCameraReady(false);
    setCameraMessage(null);
  }

  async function openDemoMode() {
    setDemoMode(true);
    await loadContext(null);
  }

  function closeCamera() {
    setCameraActive(false);
    setCameraReady(false);
    setScanLocked(false);
  }

  async function startCamera() {
    setCameraMessage(null);
    setCameraReady(false);

    if (!canCheckIn) {
      setCameraMessage("Choose an event and day before scanning tickets.");
      return;
    }

    if (!permission?.granted) {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) {
        setCameraMessage("Camera permission is required to scan tickets.");
        return;
      }
    }

    setCameraActive(true);
  }

  const submitTicket = useCallback(
    async (rawCode: string) => {
      const code = extractTicketCode(rawCode);
      if (!code || !eventId || !eventDayId) return;

      setTicketCode(code);
      setIsCheckingIn(true);
      setStatusMessage(null);

      try {
        const data = await checkInTicket(token, {
          eventId,
          eventDayId,
          sessionId: sessionId || null,
          ticketCode: code,
        });
        setResult(data);
        if (data.result === "success") {
          await refreshAttendees(eventId, eventDayId, sessionId);
        }
      } catch (error) {
        if (error instanceof ApiError && isCheckInResult(error.payload)) {
          setResult(error.payload);
        }
        setStatusMessage(messageFromError(error));
      } finally {
        setIsCheckingIn(false);
      }
    },
    [eventDayId, eventId, refreshAttendees, sessionId, token],
  );

  async function runLookup() {
    const query = lookupQuery.trim();
    if (query.length < 2) {
      setLookupResults([]);
      setLookupMessage("Enter at least 2 characters.");
      return;
    }

    setIsSearching(true);
    setLookupMessage(null);

    try {
      const data = await searchCheckInGuests(token, {
        eventId,
        eventDayId,
        sessionId: sessionId || null,
        query,
      });
      setLookupResults(data.results);
      setLookupMessage(data.message ?? (data.results.length ? null : "No matching guests found."));
    } catch (error) {
      setLookupResults([]);
      setLookupMessage(messageFromError(error));
    } finally {
      setIsSearching(false);
    }
  }

  async function addWalkUp() {
    if (!eventId || !walkUp.ticketTypeId) return;

    setIsAddingWalkUp(true);
    setStatusMessage(null);

    try {
      const data = await createWalkUp(token, {
        ...walkUp,
        eventId,
        eventDayId,
        sessionId: sessionId || null,
      });
      setResult(data);
      setStatusMessage(data.message ?? null);
      setWalkUp({
        ...emptyWalkUpForm,
        ticketTypeId: walkUp.ticketTypeId,
        paymentMode: walkUp.paymentMode,
      });
      await refreshAttendees(eventId, eventDayId, sessionId);
    } catch (error) {
      if (error instanceof ApiError && isCheckInResult(error.payload)) {
        setResult(error.payload);
      }
      setStatusMessage(messageFromError(error));
    } finally {
      setIsAddingWalkUp(false);
    }
  }

  const canCheckIn = Boolean(eventId && eventDayId);
  const notCheckedInCount = Math.max(attendees.length - checkedInCount, 0);
  const isTabletLayout = width >= 760;
  const cameraHeight = isTabletLayout ? 360 : 286;
  const selectedScopeLabel = selectedSession?.title ?? "Event gate";
  const selectedDayLabel = selectedEventDay?.label ?? "Daily admission";
  const checkInRate = attendees.length ? Math.round((checkedInCount / attendees.length) * 100) : 0;
  const resultScale = resultPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const panelGridStyle: StyleProp<ViewStyle> = isTabletLayout
    ? { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: 16 }
    : { gap: 16 };
  const halfPanelStyle: StyleProp<ViewStyle> = isTabletLayout
    ? { flexBasis: "48%", flexGrow: 1, minWidth: 330 }
    : undefined;
  const fullPanelStyle: StyleProp<ViewStyle> = isTabletLayout ? { flexBasis: "100%" } : undefined;

  if (!authReady) {
    return (
      <ScreenShell>
        <CenteredPanel>
          <ActivityIndicator color={colors.red} />
          <Text selectable style={{ color: colors.soft, fontSize: 16, marginTop: 12 }}>
            Opening check-in
          </Text>
        </CenteredPanel>
      </ScreenShell>
    );
  }

  if (!hasApiConfig()) {
    return (
      <ScreenShell>
        <CenteredPanel>
          <XCircle color={colors.red} size={28} />
          <Text selectable style={{ color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 12 }}>
            App URL missing
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: "center" }}>
            Set EXPO_PUBLIC_APP_URL to the deployed FCF Events web app.
          </Text>
        </CenteredPanel>
      </ScreenShell>
    );
  }

  if (hasSupabaseConfig && !session && !demoMode) {
    return (
      <ScreenShell maxWidth={680}>
        <View style={{ gap: 18, paddingTop: 14 }}>
          <SignInHeader />
          <Panel title="Admin Sign In" icon={TicketCheck}>
            <Field label="Email">
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                inputMode="email"
                onChangeText={setEmail}
                placeholder="login@fcf.events"
                placeholderTextColor="#717780"
                style={inputStyle}
                value={email}
              />
            </Field>
            <Field label="Password">
              <View style={{ position: "relative" }}>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password"
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#717780"
                  secureTextEntry={!passwordVisible}
                  style={[inputStyle, { paddingRight: 52 }]}
                  value={password}
                />
                <PasswordToggleButton
                  visible={passwordVisible}
                  onPress={() => setPasswordVisible((current) => !current)}
                />
              </View>
            </Field>
            <RememberMeToggle
              active={rememberMe}
              onPress={() => setRememberMe((current) => !current)}
            />
            {authMessage ? (
              <Text selectable style={{ color: colors.amber, fontSize: 14, lineHeight: 20 }}>
                {authMessage}
              </Text>
            ) : null}
            <ActionButton
              disabled={!email.trim() || !password.trim() || isSigningIn}
              icon={Mail}
              label={isSigningIn ? "Signing In" : "Sign In"}
              onPress={signIn}
            />
          </Panel>
        </View>
      </ScreenShell>
    );
  }

  if (!hasSupabaseConfig && !demoMode && !contextLoaded) {
    return (
      <ScreenShell>
        <Panel title="Demo Check-in" icon={TicketCheck}>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Supabase mobile auth variables are not set. Demo mode can connect only to a local web app running without service-role check-in auth.
          </Text>
          {contextMessage ? (
            <Text selectable style={{ color: colors.amber, fontSize: 14, lineHeight: 20 }}>
              {contextMessage}
            </Text>
          ) : null}
          <ActionButton disabled={isLoadingContext} icon={TicketCheck} label="Open Demo Check-in" onPress={openDemoMode} />
        </Panel>
      </ScreenShell>
    );
  }

  return (
    <>
      <ScreenShell>
        {/* NEW SLEEK MODERN DESIGN - Material 3 inspired event check-in surface */}
        <View style={{ gap: isTabletLayout ? 22 : 16 }}>
          <StaffTopBar
            checkedInCount={checkedInCount}
            isLoading={isLoadingContext}
            modeLabel={selectedSession ? "Seminar scan" : "Event gate"}
            onRefresh={() => void refreshAttendees()}
            onSignOut={signOut}
            selectedEventTitle={selectedEvent?.title ?? "Choose event"}
            selectedScopeLabel={selectedScopeLabel}
            totalCount={attendees.length}
          />

          {contextMessage ? (
            <StatusBanner tone="warning" text={contextMessage} />
          ) : null}

          <Panel title="Event Command Center" icon={Sparkles} style={fullPanelStyle}>
            <View style={{ flexDirection: isTabletLayout ? "row" : "column", flexWrap: "wrap", gap: 10 }}>
              <SummaryPill label="Now scanning" value={selectedEvent?.title ?? "Choose an event"} emphasis />
              <SummaryPill label="Day" value={selectedDayLabel} />
              <SummaryPill label="Area" value={selectedScopeLabel} emphasis={Boolean(selectedSession)} />
              <SummaryPill label="Progress" value={`${checkedInCount}/${attendees.length} (${checkInRate}%)`} />
            </View>

            <Field label="Quick event switcher">
              <OptionRail
                emptyText="No events are available for this scanner account."
                items={events.map((event) => ({
                  label: event.title,
                  detail: formatEventDate(event.starts_at),
                  value: event.id,
                }))}
                onChange={(value) => {
                  setEventId(value);
                  setEventDayId(eventDays.find((day) => day.event_id === value)?.id ?? "");
                  setSessionId("");
                  setLookupResults([]);
                  setLookupMessage(null);
                  setResult(null);
                  setCameraActive(false);
                }}
                value={eventId}
              />
            </Field>
            <Field label="Check-in day">
              <OptionRail
                emptyText="No check-in days are configured for this event."
                items={eventDayOptions.map((day) => ({
                  label: day.label,
                  detail: formatEventDate(day.starts_at),
                  value: day.id,
                }))}
                onChange={(value) => {
                  setEventDayId(value);
                  setSessionId("");
                  setLookupResults([]);
                  setLookupMessage(null);
                  setResult(null);
                  setCameraActive(false);
                }}
                value={eventDayId}
              />
            </Field>
            <Field label="Gate or seminar">
              <OptionRail
                items={[
                  { label: "Event gate", detail: selectedDayLabel, value: "" },
                  ...eventSessions.map((sessionItem) => ({
                    label: sessionItem.title,
                    detail: sessionItem.room ?? "Seminar",
                    value: sessionItem.id,
                  })),
                ]}
                onChange={(value) => {
                  setSessionId(value);
                  setLookupResults([]);
                  setLookupMessage(null);
                  setResult(null);
                  setCameraActive(false);
                }}
                value={sessionId}
              />
            </Field>
          </Panel>

          <View style={panelGridStyle}>
            <Panel title="Live Scanner" icon={Camera} style={[halfPanelStyle, isTabletLayout ? { flexBasis: "58%", minWidth: 430 } : undefined]}>
              <ScannerLaunchCard
                cameraHeight={cameraHeight}
                cameraMessage={cameraMessage}
                canCheckIn={canCheckIn}
                isCheckingIn={isCheckingIn}
                onManualTicket={() => setManualEntryOpen(true)}
                onOpenScanner={() => void startCamera()}
                permissionGranted={permission?.granted}
                selectedDayLabel={selectedDayLabel}
                selectedEventTitle={selectedEvent?.title ?? "Choose an event"}
                selectedSession={selectedSession}
                selectedScopeLabel={selectedScopeLabel}
              />
              <QuickActionDock
                onNote={() => setStatusMessage("Guest notes are managed from the attendee profile. Search the guest below to open the right record.")}
                onUndo={() => {
                  setResult(null);
                  setTicketCode("");
                  setStatusMessage("Last scan cleared.");
                }}
                onVip={() => {
                  setAttendeeQuery("vip");
                  setAttendeeFilter("all");
                  setStatusMessage("VIP filter ready.");
                }}
              />
            </Panel>

            <Panel title="Instant Feedback" icon={resultIcon(result)} style={[halfPanelStyle, isTabletLayout ? { flexBasis: "38%", minWidth: 320 } : undefined]}>
              <Animated.View style={{ transform: [{ scale: resultScale }] }}>
                <PremiumResultCard result={result} statusMessage={statusMessage} />
              </Animated.View>
            </Panel>

          </View>

          <View style={panelGridStyle}>
            <Panel title="Attendee Flow" icon={Users} style={[halfPanelStyle, isTabletLayout ? { flexBasis: "58%", minWidth: 430 } : undefined]}>
              <AttendeeStatsStrip checkedInCount={checkedInCount} checkInRate={checkInRate} notCheckedInCount={notCheckedInCount} />
              <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    autoCorrect={false}
                    onChangeText={setAttendeeQuery}
                    placeholder="Search attendees, ticket code, company"
                    placeholderTextColor="#717780"
                    style={inputStyle}
                    value={attendeeQuery}
                  />
                </View>
                <Pressable
                  disabled={isRefreshingAttendees}
                  onPress={() => void refreshAttendees()}
                  style={({ pressed }) => ({
                    alignItems: "center",
                    backgroundColor: pressed ? colors.panelElevated : colors.panelAlt,
                    borderColor: colors.border,
                    borderRadius: 18,
                    borderWidth: 1,
                    height: 56,
                    justifyContent: "center",
                    opacity: isRefreshingAttendees ? 0.55 : 1,
                    width: 56,
                  })}
                >
                  {isRefreshingAttendees ? <ActivityIndicator color={colors.accent} /> : <RefreshCw color={colors.soft} size={21} />}
                </Pressable>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <FilterButton active={attendeeFilter === "all"} label="All" onPress={() => setAttendeeFilter("all")} />
                <FilterButton active={attendeeFilter === "checked_in"} label="In" onPress={() => setAttendeeFilter("checked_in")} />
                <FilterButton active={attendeeFilter === "not_checked_in"} label="Waiting" onPress={() => setAttendeeFilter("not_checked_in")} />
              </View>
              <View style={{ gap: 10 }}>
                {visibleAttendees.length ? (
                  visibleAttendees.map((attendee) => (
                    <AttendeeRow
                      attendee={attendee}
                      disabled={isCheckingIn}
                      key={attendee.registration_id}
                      onCheckIn={(code) => void submitTicket(code)}
                    />
                  ))
                ) : (
                  <EmptyText text={attendees.length ? "No attendees match the current filters." : "No attendees are registered for this event."} />
                )}
              </View>
            </Panel>

            <Panel title="Manual Ticket" icon={Keyboard} style={[halfPanelStyle, isTabletLayout ? { flexBasis: "38%", minWidth: 320 } : undefined]}>
              <ActionButton
                icon={Keyboard}
                label={manualEntryOpen || isTabletLayout ? "Manual Entry Ready" : "Manual Ticket"}
                onPress={() => setManualEntryOpen((current) => !current)}
                variant={manualEntryOpen || isTabletLayout ? "secondary" : "primary"}
              />
              {manualEntryOpen || isTabletLayout ? (
                <View style={{ gap: 12 }}>
                  <Field label="Ticket code">
                    <TextInput
                      autoCapitalize="characters"
                      autoCorrect={false}
                      onChangeText={setTicketCode}
                      onSubmitEditing={() => void submitTicket(ticketCode)}
                      placeholder="FCF-..."
                      placeholderTextColor="#717780"
                      style={inputStyle}
                      value={ticketCode}
                    />
                  </Field>
                  <ActionButton
                    disabled={!ticketCode.trim() || !canCheckIn || isCheckingIn}
                    icon={TicketCheck}
                    label={isCheckingIn ? "Checking In" : "Check In Ticket"}
                    onPress={() => void submitTicket(ticketCode)}
                  />
                </View>
              ) : null}
              <View style={{ borderTopColor: colors.border, borderTopWidth: 1, gap: 12, paddingTop: 14 }}>
                <Field label="Guest lookup">
                  <TextInput
                    autoCorrect={false}
                    onChangeText={setLookupQuery}
                    onSubmitEditing={() => void runLookup()}
                    placeholder="Name, email, phone, or code"
                    placeholderTextColor="#717780"
                    style={inputStyle}
                    value={lookupQuery}
                  />
                </Field>
                <ActionButton disabled={!canCheckIn || isSearching} icon={Search} label={isSearching ? "Searching" : "Search Guest"} onPress={() => void runLookup()} />
                {lookupMessage ? (
                  <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
                    {lookupMessage}
                  </Text>
                ) : null}
                <View style={{ gap: 10 }}>
                  {lookupResults.map((guest) => (
                    <LookupRow disabled={isCheckingIn} guest={guest} key={guest.ticketId} onCheckIn={(code) => void submitTicket(code)} />
                  ))}
                </View>
              </View>
            </Panel>
          </View>

          <Panel title="Walk-up Guest" icon={UserPlus} style={fullPanelStyle}>
          <TwoColumn width={width}>
            <Field label="First name">
              <WalkUpInput value={walkUp.firstName} onChangeText={(value) => setWalkUp((current) => ({ ...current, firstName: value }))} />
            </Field>
            <Field label="Last name">
              <WalkUpInput value={walkUp.lastName} onChangeText={(value) => setWalkUp((current) => ({ ...current, lastName: value }))} />
            </Field>
            <Field label="Email">
              <WalkUpInput
                autoCapitalize="none"
                inputMode="email"
                value={walkUp.email}
                onChangeText={(value) => setWalkUp((current) => ({ ...current, email: value }))}
              />
            </Field>
            <Field label="Phone">
              <WalkUpInput
                inputMode="tel"
                value={walkUp.phone}
                onChangeText={(value) => setWalkUp((current) => ({ ...current, phone: value }))}
              />
            </Field>
          </TwoColumn>
          <Field label="Ticket type">
            <OptionRail
              items={eventTicketTypes.map((ticketType) => ({
                label: ticketType.name,
                detail: formatMoney(ticketType.price, ticketType.currency),
                value: ticketType.id,
              }))}
              onChange={(value) => setWalkUp((current) => ({ ...current, ticketTypeId: value }))}
              value={walkUp.ticketTypeId}
            />
          </Field>
          <Field label="Payment">
            <View style={{ flexDirection: "row", gap: 8 }}>
              <FilterButton
                active={walkUp.paymentMode === "cash"}
                label="Cash"
                onPress={() => setWalkUp((current) => ({ ...current, paymentMode: "cash" }))}
              />
              <FilterButton
                active={walkUp.paymentMode === "comp"}
                label="Comp"
                onPress={() => setWalkUp((current) => ({ ...current, paymentMode: "comp" }))}
              />
            </View>
          </Field>
          <TwoColumn width={width}>
            <Field label="Company">
              <WalkUpInput value={walkUp.company} onChangeText={(value) => setWalkUp((current) => ({ ...current, company: value }))} />
            </Field>
            <Field label="Role / title">
              <WalkUpInput value={walkUp.roleTitle} onChangeText={(value) => setWalkUp((current) => ({ ...current, roleTitle: value }))} />
            </Field>
          </TwoColumn>
          <ActionButton
            disabled={!walkUp.firstName.trim() || !walkUp.lastName.trim() || !walkUp.ticketTypeId || isAddingWalkUp}
            icon={UserPlus}
            label={isAddingWalkUp ? "Adding" : "Add and Check In"}
            onPress={() => void addWalkUp()}
          />
          </Panel>
        </View>
      </ScreenShell>
      <Modal
        animationType="slide"
        navigationBarTranslucent
        onRequestClose={closeCamera}
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={cameraActive && Boolean(permission?.granted)}
      >
        <View style={{ backgroundColor: "#000", flex: 1 }}>
          <CameraView
            active={cameraActive && Boolean(permission?.granted)}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            facing="back"
            onBarcodeScanned={
              scanLocked
                ? undefined
                : ({ data }) => {
                    setScanLocked(true);
                    setCameraActive(false);
                    setCameraReady(false);
                    void submitTicket(data).finally(() => {
                      setTimeout(() => setScanLocked(false), 900);
                    });
                  }
            }
            onCameraReady={() => setCameraReady(true)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              left: 14,
              position: "absolute",
              right: 14,
              top: insets.top + 12,
            }}
          >
            <View style={{ alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
              <View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.72)",
                  borderColor: "rgba(255, 255, 255, 0.18)",
                  borderRadius: 8,
                  borderWidth: 1,
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
                  {selectedSession ? "Seminar scan" : "Event gate scan"}
                </Text>
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: 16, fontWeight: "900", marginTop: 2 }}>
                  {selectedScopeLabel}
                </Text>
                <Text numberOfLines={1} style={{ color: colors.soft, fontSize: 13, fontWeight: "700", marginTop: 2 }}>
                  {selectedEvent?.title ?? "Check-in"} - {selectedDayLabel}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close scanner"
                accessibilityRole="button"
                onPress={closeCamera}
                style={({ pressed }) => ({
                  alignItems: "center",
                  backgroundColor: pressed ? "rgba(229, 9, 19, 0.92)" : "rgba(0, 0, 0, 0.72)",
                  borderColor: "rgba(255, 255, 255, 0.18)",
                  borderRadius: 8,
                  borderWidth: 1,
                  height: 54,
                  justifyContent: "center",
                  width: 54,
                })}
              >
                <XCircle color={colors.text} size={26} />
              </Pressable>
            </View>
          </View>
          <View
            pointerEvents="none"
            style={{
              alignItems: "center",
              bottom: insets.bottom + 28,
              left: 20,
              position: "absolute",
              right: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.72)",
                borderColor: colors.red,
                borderRadius: 8,
                borderWidth: 1,
                paddingHorizontal: 18,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", textAlign: "center" }}>
                Hold ticket QR in frame
              </Text>
            </View>
          </View>
          {!cameraReady ? (
            <View
              pointerEvents="none"
              style={{
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.72)",
                bottom: 0,
                justifyContent: "center",
                left: 0,
                position: "absolute",
                right: 0,
                top: 0,
              }}
            >
              <ActivityIndicator color={colors.red} />
              <Text style={{ color: colors.soft, fontSize: 14, fontWeight: "700", marginTop: 10 }}>
                Opening camera
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

function ScreenShell({ children, maxWidth = 1180 }: { children: React.ReactNode; maxWidth?: number }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 760;
  const horizontalPadding = isWide ? 24 : 16;
  const topPadding = isWide ? 24 : 16;
  const bottomPadding = isWide ? 44 : 36;

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
      style={{ backgroundColor: colors.background, flex: 1, paddingBottom: insets.bottom, paddingTop: insets.top }}
    >
      <ScrollView
        contentContainerStyle={{
          alignItems: "center",
          gap: 16,
          paddingBottom: bottomPadding,
          paddingHorizontal: horizontalPadding,
          paddingTop: topPadding,
        }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        <View style={{ gap: 16, maxWidth, width: "100%" }}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CenteredPanel({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.panelElevated,
        borderColor: colors.border,
        borderRadius: 28,
        borderWidth: 1,
        boxShadow: "0 18px 42px rgba(0, 0, 0, 0.3)",
        justifyContent: "center",
        minHeight: 320,
        padding: 22,
      }}
    >
      {children}
    </View>
  );
}

function SignInHeader() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;
  const tileSize = isWide ? 140 : 118;
  const markSize = isWide ? 110 : 92;

  return (
    <View style={{ alignItems: "center", gap: 12 }}>
      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.backgroundAlt,
          borderColor: `${colors.accent}66`,
          borderRadius: 30,
          borderWidth: 1,
          boxShadow: "0 18px 38px rgba(45, 212, 191, 0.12)",
          height: tileSize,
          justifyContent: "center",
          width: tileSize,
        }}
      >
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../assets/icon.png")}
          style={{ height: markSize, width: markSize }}
        />
      </View>
      <View style={{ alignItems: "center", gap: 5 }}>
        <Text selectable style={{ color: colors.text, fontSize: isWide ? 36 : 30, fontWeight: "900", textAlign: "center" }}>
          FCF Check-in
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 14, fontWeight: "700", textAlign: "center" }}>
          Admin access
        </Text>
      </View>
    </View>
  );
}

function Panel({
  children,
  icon: Icon,
  style,
  title,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  style?: StyleProp<ViewStyle>;
  title: string;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.panelElevated,
          borderColor: colors.border,
          borderRadius: 24,
          borderWidth: 1,
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.24)",
          gap: 16,
          padding: 18,
        },
        style,
      ]}
    >
      <View style={{ alignItems: "center", flexDirection: "row", gap: 10 }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: `${colors.accent}18`,
            borderColor: `${colors.accent}44`,
            borderRadius: 14,
            borderWidth: 1,
            height: 34,
            justifyContent: "center",
            width: 34,
          }}
        >
          <Icon color={colors.accent} size={19} />
        </View>
        <Text selectable style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text selectable style={{ color: colors.muted, fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function ActionButton({
  disabled,
  icon: Icon,
  label,
  onPress,
  variant = "primary",
}: {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const isSecondary = variant === "secondary";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: disabled ? "#343a46" : isSecondary ? (pressed ? colors.panelElevated : colors.panelAlt) : pressed ? colors.accentDark : colors.accent,
        borderColor: disabled ? "#475063" : isSecondary ? colors.border : colors.accent,
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: "row",
        gap: 8,
        justifyContent: "center",
        minHeight: 56,
        opacity: disabled ? 0.58 : 1,
        paddingHorizontal: 16,
      })}
    >
      <Icon color={colors.text} size={18} />
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
        {label}
      </Text>
    </Pressable>
  );
}

function IconButton({ disabled, icon: Icon, onPress }: { disabled?: boolean; icon: LucideIcon; onPress: () => void }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: pressed ? colors.panelElevated : colors.panelAlt,
        borderColor: colors.border,
        borderRadius: 18,
        borderWidth: 1,
        height: 56,
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
        width: 56,
      })}
    >
      <Icon color={colors.soft} size={20} />
    </Pressable>
  );
}

function PasswordToggleButton({ onPress, visible }: { onPress: () => void; visible: boolean }) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <Pressable
      accessibilityLabel={visible ? "Hide password" : "Show password"}
      accessibilityRole="button"
      accessibilityState={{ selected: visible }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: pressed ? colors.panelElevated : "transparent",
        borderRadius: 14,
        height: 48,
        justifyContent: "center",
        position: "absolute",
        right: 4,
        top: 4,
        width: 48,
      })}
    >
      <Icon color={colors.soft} size={20} />
    </Pressable>
  );
}

function RememberMeToggle({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Remember me on this device"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: pressed ? colors.panelElevated : colors.panelAlt,
        borderColor: active ? colors.accent : colors.border,
        borderRadius: 18,
        borderWidth: 1,
        flexDirection: "row",
        gap: 10,
        minHeight: 56,
        paddingHorizontal: 14,
      })}
    >
      <View
        style={{
          alignItems: "center",
          backgroundColor: active ? colors.accent : "transparent",
          borderColor: active ? colors.accent : colors.muted,
          borderRadius: 6,
          borderWidth: 1,
          height: 24,
          justifyContent: "center",
          width: 24,
        }}
      >
        {active ? <CheckCircle2 color={colors.text} size={16} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
          Remember me
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 2 }}>
          Keep this scanner account signed in on this device.
        </Text>
      </View>
    </Pressable>
  );
}

function StaffTopBar({
  checkedInCount,
  isLoading,
  modeLabel,
  onRefresh,
  onSignOut,
  selectedEventTitle,
  selectedScopeLabel,
  totalCount,
}: {
  checkedInCount: number;
  isLoading: boolean;
  modeLabel: string;
  onRefresh: () => void;
  onSignOut: () => void;
  selectedEventTitle: string;
  selectedScopeLabel: string;
  totalCount: number;
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  return (
    <View
      style={{
        alignItems: isWide ? "center" : "stretch",
        backgroundColor: colors.panel,
        borderColor: colors.border,
        borderRadius: 26,
        borderWidth: 1,
        boxShadow: "0 18px 42px rgba(0, 0, 0, 0.28)",
        flexDirection: isWide ? "row" : "column",
        gap: 14,
        justifyContent: "space-between",
        padding: isWide ? 18 : 16,
      }}
    >
      <View style={{ alignItems: "center", flex: 1, flexDirection: "row", gap: 14, minWidth: 0 }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: colors.backgroundAlt,
            borderColor: `${colors.accent}66`,
            borderRadius: 20,
            borderWidth: 1,
            height: 58,
            justifyContent: "center",
            width: 58,
          }}
        >
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={require("../../assets/icon.png")}
            style={{ height: 40, width: 40 }}
          />
        </View>
        <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
          <View style={{ alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <StatusPill label={modeLabel} />
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "800" }}>
              {checkedInCount}/{totalCount} checked in
            </Text>
          </View>
          <Text numberOfLines={2} selectable style={{ color: colors.text, fontSize: isWide ? 27 : 22, fontWeight: "900", lineHeight: isWide ? 32 : 27 }}>
            {selectedEventTitle}
          </Text>
          <Text numberOfLines={1} selectable style={{ color: colors.soft, fontSize: 14, fontWeight: "700" }}>
            {selectedScopeLabel}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 10, justifyContent: isWide ? "flex-end" : "space-between" }}>
        <IconButton disabled={isLoading} icon={RefreshCw} onPress={onRefresh} />
        <IconButton disabled={isLoading} icon={LogOut} onPress={onSignOut} />
      </View>
    </View>
  );
}

function ScannerLaunchCard({
  cameraHeight,
  cameraMessage,
  canCheckIn,
  isCheckingIn,
  onManualTicket,
  onOpenScanner,
  permissionGranted,
  selectedDayLabel,
  selectedEventTitle,
  selectedSession,
  selectedScopeLabel,
}: {
  cameraHeight: number;
  cameraMessage: string | null;
  canCheckIn: boolean;
  isCheckingIn: boolean;
  onManualTicket: () => void;
  onOpenScanner: () => void;
  permissionGranted?: boolean;
  selectedDayLabel: string;
  selectedEventTitle: string;
  selectedSession: SessionSummary | null;
  selectedScopeLabel: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#02040a",
        borderColor: canCheckIn ? `${colors.accent}66` : `${colors.amber}55`,
        borderRadius: 28,
        borderWidth: 1,
        minHeight: cameraHeight,
        overflow: "hidden",
        padding: 18,
      }}
    >
      <View
        style={{
          alignItems: "center",
          borderColor: `${colors.soft}22`,
          borderRadius: 24,
          borderWidth: 1,
          flex: 1,
          gap: 16,
          justifyContent: "center",
          minHeight: cameraHeight - 36,
          padding: 20,
        }}
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: `${colors.accent}16`,
            borderColor: `${colors.accent}55`,
            borderRadius: 34,
            borderWidth: 1,
            height: 68,
            justifyContent: "center",
            width: 68,
          }}
        >
          <Camera color={colors.accent} size={36} />
        </View>
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text selectable style={{ color: colors.text, fontSize: 21, fontWeight: "900", textAlign: "center" }}>
            {canCheckIn ? selectedScopeLabel : "Choose an event and day"}
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, fontWeight: "700", lineHeight: 20, textAlign: "center" }}>
            {selectedEventTitle} - {selectedDayLabel}
            {selectedSession?.room ? ` - ${selectedSession.room}` : ""}
          </Text>
        </View>
        <StatusPill label={selectedSession ? "Seminar check-in" : "Event gate check-in"} />
        {cameraMessage ? (
          <Text selectable style={{ color: colors.amber, fontSize: 13, fontWeight: "700", lineHeight: 18, textAlign: "center" }}>
            {cameraMessage}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", width: "100%" }}>
          <View style={{ flexGrow: 1, minWidth: 210 }}>
            <ActionButton
              disabled={isCheckingIn}
              icon={Camera}
              label={permissionGranted ? "Start Full-Screen Scanner" : "Allow Camera"}
              onPress={onOpenScanner}
            />
          </View>
          <View style={{ flexGrow: 1, minWidth: 160 }}>
            <ActionButton icon={Keyboard} label="Manual Ticket" onPress={onManualTicket} variant="secondary" />
          </View>
        </View>
      </View>
    </View>
  );
}

function QuickActionDock({ onNote, onUndo, onVip }: { onNote: () => void; onUndo: () => void; onVip: () => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <QuickDockButton icon={Crown} label="VIP" onPress={onVip} />
      <QuickDockButton icon={NotebookPen} label="Note" onPress={onNote} />
      <QuickDockButton icon={Undo2} label="Undo" onPress={onUndo} />
    </View>
  );
}

function QuickDockButton({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: pressed ? colors.panelElevated : colors.panelAlt,
        borderColor: colors.border,
        borderRadius: 18,
        borderWidth: 1,
        flex: 1,
        gap: 6,
        minHeight: 70,
        justifyContent: "center",
      })}
    >
      <Icon color={colors.accent} size={21} />
      <Text style={{ color: colors.soft, fontSize: 12, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function PremiumResultCard({
  result,
  statusMessage,
}: {
  result: CheckInResult | WalkUpCheckInResult | null;
  statusMessage: string | null;
}) {
  if (!result) {
    return (
      <View style={{ alignItems: "center", backgroundColor: colors.backgroundAlt, borderColor: colors.border, borderRadius: 24, borderWidth: 1, gap: 14, minHeight: 260, justifyContent: "center", padding: 20 }}>
        <Sparkles color={colors.accent} size={42} />
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "center" }}>
            Ready for next scan
          </Text>
          <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" }}>
            Scan a QR ticket or enter a code manually.
          </Text>
        </View>
      </View>
    );
  }

  const Icon = resultIcon(result);
  const tone = resultTone(result.result);
  const toneColor = tone === "success" ? colors.green : tone === "warning" ? colors.amber : colors.danger;
  const ticketCode = "ticketCode" in result ? result.ticketCode : null;
  const name = result.attendeeName ?? "Guest";

  return (
    <View
      style={{
        backgroundColor: `${toneColor}12`,
        borderColor: `${toneColor}66`,
        borderRadius: 24,
        borderWidth: 1,
        gap: 14,
        minHeight: 260,
        padding: 18,
      }}
    >
      <View style={{ alignItems: "center", gap: 12 }}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: `${toneColor}22`,
            borderColor: `${toneColor}66`,
            borderRadius: 36,
            borderWidth: 1,
            height: 72,
            justifyContent: "center",
            width: 72,
          }}
        >
          <Icon color={toneColor} size={42} />
        </View>
        <StatusBanner tone={tone} text={result.result.replaceAll("_", " ")} />
      </View>
      <View
        style={{
          alignItems: "center",
          backgroundColor: colors.panel,
          borderColor: colors.border,
          borderRadius: 20,
          borderWidth: 1,
          flexDirection: "row",
          gap: 12,
          padding: 14,
        }}
      >
        <View
          style={{
            alignItems: "center",
            backgroundColor: `${colors.indigo}30`,
            borderColor: `${colors.indigo}66`,
            borderRadius: 22,
            borderWidth: 1,
            height: 48,
            justifyContent: "center",
            width: 48,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900" }}>{getInitials(name)}</Text>
        </View>
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <Text numberOfLines={2} selectable style={{ color: colors.text, fontSize: 19, fontWeight: "900", lineHeight: 23 }}>
            {name}
          </Text>
          <Text numberOfLines={1} selectable style={{ color: colors.muted, fontSize: 13, fontWeight: "700" }}>
            {result.ticketTypeName ?? "Ticket"}
          </Text>
        </View>
      </View>
      {statusMessage ? (
        <Text selectable style={{ color: colors.soft, fontSize: 14, fontWeight: "700", lineHeight: 20 }}>
          {statusMessage}
        </Text>
      ) : null}
      {ticketCode ? <InfoLine label="Ticket code" value={ticketCode} /> : null}
      {result.checkedInAt ? <InfoLine label="Checked in" value={formatDate(result.checkedInAt)} /> : null}
      {result.priorCheckedInAt ? <InfoLine label="Prior check-in" value={formatDate(result.priorCheckedInAt)} /> : null}
    </View>
  );
}

function AttendeeStatsStrip({
  checkedInCount,
  checkInRate,
  notCheckedInCount,
}: {
  checkedInCount: number;
  checkInRate: number;
  notCheckedInCount: number;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <CounterPill label="Checked in" value={checkedInCount} tone="success" />
        <CounterPill label="Waiting" value={notCheckedInCount} tone="muted" />
        <View
          style={{
            alignItems: "center",
            backgroundColor: `${colors.indigo}20`,
            borderColor: `${colors.indigo}66`,
            borderRadius: 999,
            borderWidth: 1,
            flexDirection: "row",
            gap: 8,
            minHeight: 42,
            paddingHorizontal: 14,
          }}
        >
          <Star color={colors.indigo} size={16} />
          <Text style={{ color: colors.text, fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "900" }}>{checkInRate}% flow</Text>
        </View>
      </View>
      <View style={{ backgroundColor: colors.panelAlt, borderRadius: 999, height: 8, overflow: "hidden" }}>
        <View style={{ backgroundColor: colors.accent, borderRadius: 999, height: 8, width: `${Math.min(checkInRate, 100)}%` }} />
      </View>
    </View>
  );
}

function OptionRail({
  emptyText = "No options available.",
  items,
  onChange,
  value,
}: {
  emptyText?: string;
  items: { label: string; detail?: string; value: string }[];
  onChange: (value: string) => void;
  value: string;
}) {
  if (!items.length) return <EmptyText text={emptyText} />;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: 10, paddingRight: 4 }}>
        {items.map((item) => {
          const active = item.value === value;
          return (
            <Pressable
              key={`${item.value}-${item.label}`}
              onPress={() => onChange(item.value)}
              style={({ pressed }) => ({
                backgroundColor: active ? colors.accentDark : pressed ? colors.panelElevated : colors.panelAlt,
                borderColor: active ? colors.accent : colors.border,
                borderRadius: 18,
                borderWidth: 1,
                maxWidth: 280,
                minHeight: 68,
                minWidth: 150,
                paddingHorizontal: 14,
                paddingVertical: 12,
              })}
            >
              <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: "900" }}>
                {item.label}
              </Text>
              {item.detail ? (
                <Text numberOfLines={1} style={{ color: active ? "#ccfbf1" : colors.muted, fontSize: 12, fontWeight: "700", marginTop: 5 }}>
                  {item.detail}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function SummaryPill({ emphasis, label, value }: { emphasis?: boolean; label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: emphasis ? `${colors.accent}18` : colors.panelAlt,
        borderColor: emphasis ? colors.accent : colors.border,
        borderRadius: 18,
        borderWidth: 1,
        flexGrow: 1,
        minHeight: 66,
        minWidth: 150,
        paddingHorizontal: 14,
        paddingVertical: 11,
      }}
    >
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text numberOfLines={2} style={{ color: colors.text, fontSize: 15, fontWeight: "900", lineHeight: 19, marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: `${colors.accent}18`,
        borderColor: `${colors.accent}66`,
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "900" }}>{label}</Text>
    </View>
  );
}

function StatusBanner({ text, tone }: { text: string; tone: "success" | "warning" | "danger" | "muted" }) {
  const toneColor = tone === "success" ? colors.green : tone === "warning" ? colors.amber : tone === "danger" ? colors.danger : colors.blue;
  return (
    <View
      style={{
        backgroundColor: `${toneColor}22`,
        borderColor: `${toneColor}66`,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 11,
      }}
    >
      <Text selectable style={{ color: colors.text, fontSize: 15, fontWeight: "800", textTransform: "capitalize" }}>
        {text}
      </Text>
    </View>
  );
}

function CounterPill({ label, tone, value }: { label: string; tone: "success" | "muted"; value: number }) {
  const color = tone === "success" ? colors.green : colors.muted;
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: `${color}18`,
        borderColor: `${color}55`,
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: "row",
        gap: 7,
        minHeight: 42,
        paddingHorizontal: 14,
      }}
    >
      <Text style={{ color, fontSize: 13, fontWeight: "800" }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "900" }}>{value}</Text>
    </View>
  );
}

function FilterButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        backgroundColor: active ? colors.indigo : pressed ? colors.panelElevated : colors.panelAlt,
        borderColor: active ? colors.indigo : colors.border,
        borderRadius: 16,
        borderWidth: 1,
        flex: 1,
        minHeight: 48,
        justifyContent: "center",
        paddingHorizontal: 10,
      })}
    >
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

function AttendeeRow({
  attendee,
  disabled,
  onCheckIn,
}: {
  attendee: EventAttendeeSummary;
  disabled: boolean;
  onCheckIn: (ticketCode: string) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.panelAlt,
        borderColor: colors.border,
        borderRadius: 20,
        borderWidth: 1,
        gap: 12,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, justifyContent: "space-between" }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
            {attendee.full_name}
          </Text>
          <Text selectable numberOfLines={2} style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>
            {attendee.company ?? attendee.role_title ?? attendee.email ?? "No contact listed"}
          </Text>
        </View>
        {attendee.checked_in_at ? <CheckCircle2 color={colors.green} size={22} /> : <Clock3 color={colors.muted} size={22} />}
      </View>
      <InfoLine label={attendee.ticket_type_name ?? "Ticket"} value={attendee.ticket_code ?? "No ticket issued"} />
      {attendee.checked_in_at ? <InfoLine label="Checked in" value={formatDate(attendee.checked_in_at)} /> : null}
      <ActionButton
        disabled={!attendee.ticket_code || disabled}
        icon={TicketCheck}
        label={attendee.checked_in_at ? "Review" : "Check In"}
        onPress={() => {
          if (attendee.ticket_code) onCheckIn(attendee.ticket_code);
        }}
        variant={attendee.checked_in_at ? "secondary" : "primary"}
      />
    </View>
  );
}

function LookupRow({
  disabled,
  guest,
  onCheckIn,
}: {
  disabled: boolean;
  guest: CheckInLookupResult;
  onCheckIn: (ticketCode: string) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.panelAlt,
        borderColor: colors.border,
        borderRadius: 20,
        borderWidth: 1,
        gap: 12,
        padding: 14,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
          {guest.attendeeName}
        </Text>
        <Text selectable style={{ color: colors.muted, fontSize: 13 }}>
          {guest.attendeeEmail ?? guest.attendeePhone ?? "No contact listed"}
        </Text>
      </View>
      <InfoLine label={guest.ticketTypeName ?? "Ticket"} value={guest.ticketCode} />
      {guest.checkedInAt ? <InfoLine label="Checked in" value={formatDate(guest.checkedInAt)} /> : null}
      <ActionButton
        disabled={disabled}
        icon={TicketCheck}
        label={guest.checkedInAt ? "Review" : "Check In"}
        onPress={() => onCheckIn(guest.ticketCode)}
        variant={guest.checkedInAt ? "secondary" : "primary"}
      />
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, justifyContent: "space-between" }}>
      <Text selectable style={{ color: colors.muted, flex: 1, fontSize: 13 }}>
        {label}
      </Text>
      <Text selectable style={{ color: colors.soft, flex: 1.4, fontSize: 13, textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.panelAlt,
        borderColor: colors.border,
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
      }}
    >
      <Text selectable style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        {text}
      </Text>
    </View>
  );
}

function WalkUpInput(props: TextInputProps) {
  return <TextInput autoCorrect={false} placeholderTextColor="#717780" style={inputStyle} {...props} />;
}

function TwoColumn({ children, width }: { children: React.ReactNode; width: number }) {
  const useColumns = width >= 620;
  return (
    <View style={{ flexDirection: useColumns ? "row" : "column", flexWrap: "wrap", gap: 12 }}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <View key={index} style={{ flex: useColumns ? 1 : undefined, minWidth: useColumns ? 250 : undefined }}>
              {child}
            </View>
          ))
        : children}
    </View>
  );
}

const inputStyle = {
  backgroundColor: colors.panelAlt,
  borderColor: colors.border,
  borderRadius: 18,
  borderWidth: 1,
  color: colors.text,
  fontSize: 16,
  minHeight: 56,
  paddingHorizontal: 14,
} as const;

function extractTicketCode(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    return decodeURIComponent(parts.at(-1) ?? value).trim();
  } catch {
    return value.split("?")[0]?.split("/").pop()?.trim() ?? value;
  }
}

function messageFromError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

function isCheckInResult(value: unknown): value is CheckInResult {
  return Boolean(value && typeof value === "object" && "result" in value && typeof (value as CheckInResult).result === "string");
}

function resultIcon(result: CheckInResult | WalkUpCheckInResult | null): LucideIcon {
  if (!result) return TicketCheck;
  return result.result === "success" || result.result === "duplicate" ? CheckCircle2 : XCircle;
}

function resultTone(result: CheckInResult["result"]): "success" | "warning" | "danger" | "muted" {
  if (result === "success") return "success";
  if (result === "duplicate") return "warning";
  return "danger";
}

function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "FC";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function formatEventDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
  }).format(value);
}
