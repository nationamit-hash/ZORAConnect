/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  User, 
  Settings, 
  Bell, 
  LogOut, 
  Plus, 
  Trash2,
  Search, 
  FileSpreadsheet, 
  Filter, 
  Briefcase, 
  Utensils, 
  Brush, 
  Shirt, 
  Wrench, 
  CircleDollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  HelpCircle,
  MessageSquare,
  PhoneCall,
  Hash,
  ShieldAlert,
  Users,
  Grid,
  Table,
  ArrowUpDown,
  Send,
  Sliders,
  Shield,
  Smartphone,
  Zap,
  Megaphone,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  AlertOctagon,
  KeyRound,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Bed,
  Database,
  Download,
  Monitor,
  Laptop
} from 'lucide-react';
import { Tenant, Ticket, Notification, TicketComment, GatePass, Notice, MealFeedback, LostFoundItem, RoomDoc, RentPayment, Salary, Session } from './types';
import { dbService, auth, firebaseAuthPromise } from './lib/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { playCyberBlip, playBuzzer, playSuccessTone } from './hooks/useSound';
import { requestPushPermission, sendPushNotification, ToastMessage, NotificationBanner } from './components/NotificationBanner';
import { RaiseTicketModal } from './components/RaiseTicketModal';
import { RaiseLostFoundModal } from './components/RaiseLostFoundModal';
import { AddTenantModal } from './components/AddTenantModal';
import { EditTenantModal } from './components/EditTenantModal';
import { DeleteTenantModal } from './components/DeleteTenantModal';
import { AddRoomModal } from './components/AddRoomModal';
import { AllotBedModal } from './components/AllotBedModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { WorkspaceCenter } from './components/WorkspaceCenter';
import { ZiaChatbot } from './components/ZiaChatbot';
import { LostFoundSection } from './components/LostFoundSection';
import { TenantOnboardingWizard } from './components/TenantOnboardingWizard';
import { ZoraLogo } from './components/ZoraLogo';
import { SpeedInsights } from '@vercel/speed-insights/react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function App() {
  // Stable Unique Tab Session ID (Persisted in sessionStorage to survive tab reloads but be specific to this tab)
  const currentSessionId = React.useMemo(() => {
    let sessId = sessionStorage.getItem('zora_tab_session_id');
    if (!sessId) {
      sessId = 'sess_' + Math.floor(Math.random() * 1000000);
      sessionStorage.setItem('zora_tab_session_id', sessId);
    }
    return sessId;
  }, []);

  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  // Auth Session States
  const [sessionUser, setSessionUser] = useState<{ role: 'tenant' | 'manager' | 'employee'; info: any } | null>(() => {
    try {
      const saved = localStorage.getItem('zora_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Automatically persist session user to local storage for persistent sessions survival
  useEffect(() => {
    if (sessionUser) {
      localStorage.setItem('zora_session_user', JSON.stringify(sessionUser));
    } else {
      localStorage.removeItem('zora_session_user');
    }
  }, [sessionUser]);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'tenant' | 'manager' | 'employee'>('tenant');
  const [loginError, setLoginError] = useState('');

  // Live Sync Collection States
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [meals, setMeals] = useState<MealFeedback[]>([]);
  const [lostFoundItems, setLostFoundItems] = useState<LostFoundItem[]>([]);

  // Auto-Refresh States for Resolver Hub
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [activePassType, setActivePassType] = useState<'leave' | 'late-entry' | 'visitor'>('leave');

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Database Connection Readiness State
  const [isAuthReady, setIsAuthReady] = useState(!dbService.isRealFirebase());

  function resetAppState() {
    console.log("Resetting application-specific state flags.");
    setSessionUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setIsRaiseModalOpen(false);
    setIsLostFoundModalOpen(false);
    setIsAddTenantModalOpen(false);
    setIsAddRoomModalOpen(false);
    setIsEditTenantModalOpen(false);
    setEditingTenant(null);
    setIsAllotBedModalOpen(false);
    setInspectingResidentId(null);
    setTenantIdToDelete(null);
    setSelectedTicket(null);
    setIsOnboardingModalOpen(false);
    setNewNoticeTitle('');
    setNewNoticeContent('');
    setBreakfastMenuInput('');
    setBreakfastSubInput('');
    setLunchMenuInput('');
    setLunchSubInput('');
    setDinnerMenuInput('');
    setDinnerSubInput('');
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsAuthReady(true);
        if (!user) {
          console.log("Firebase Auth: State changed - User logged out.");
          // Guard state reset so page refreshes don't destroy sessionUser from localStorage.
          const hasSavedSession = !!localStorage.getItem('zora_session_user');
          if (!hasSavedSession) {
            resetAppState();
          }
        }
      });
    } else {
      setIsAuthReady(true);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ACTIVE WORKSPACE SESSION TRACKING & SECURITY HANDSHAKING
  useEffect(() => {
    if (!isAuthReady || !sessionUser) {
      setActiveSessions([]);
      return;
    }
    const CURRENT_BUILD_VERSION = "v_2026_06_03_1632";
    const userId = sessionUser.role === 'tenant' ? sessionUser.info.tenantId : sessionUser.info.email;

    // Sub to all active sessions of this user
    const unsubscribeAll = dbService.subscribeUserSessions(userId, (sessions) => {
      // Sort active first, then last active desc
      const sorted = [...sessions].sort((a, b) => {
        if (a.id === currentSessionId) return -1;
        if (b.id === currentSessionId) return 1;
        return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
      });
      setActiveSessions(sorted);

      // Force purge and revoke older active sessions belonging to older versions of the application immediately
      const staleActiveSessions = sessions.filter(s => s.status === 'active' && s.id !== currentSessionId && s.buildVersion !== CURRENT_BUILD_VERSION);
      if (staleActiveSessions.length > 0) {
        staleActiveSessions.forEach(stale => {
          console.warn(`[Zora Security] Revoking stale connection on older version detected: ${stale.id} / ${stale.userAgent}`);
          dbService.saveSession({
            ...stale,
            status: 'revoked'
          }).catch(err => console.error("Stale session revocation error:", err));
        });
      }
    });

    // Sub to this specific session to check for revocation
    const unsubscribeSelf = dbService.subscribeSingleSession(currentSessionId, (sess) => {
      if (sess && sess.status === 'revoked') {
        const hasSaved = !!localStorage.getItem('zora_session_user');
        if (hasSaved) {
          addToast("Device Discarded", "Your session was terminated. Reloading to check for system updates...", "warning");
          playBuzzer();
          handleLogout();
          // Force immediate clean reload of the tab bypassing caching entirely
          setTimeout(() => {
            window.location.replace(window.location.origin + '?cb=' + Date.now());
          }, 1500);
        }
      }
    });

    // Send active session heartbeat
    const sendPulse = async () => {
      let uaDesc = 'Web Browser on Desktop';
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) uaDesc = 'Chrome (Google Workspace Interface)';
        else if (ua.includes('Safari')) uaDesc = 'Apple Safari Secure Environment';
        else if (ua.includes('Firefox')) uaDesc = 'Mozilla Firefox OS';
        else if (ua.includes('Windows')) uaDesc = 'Windows App Window';
        else if (ua.includes('iPhone') || ua.includes('Android')) uaDesc = 'Mobile Smartphone Chrome';
      }

      await dbService.saveSession({
        id: currentSessionId,
        userId: userId,
        role: sessionUser.role,
        name: sessionUser.info.name || 'Zora Staff',
        userAgent: uaDesc,
        lastActive: new Date().toISOString(),
        status: 'active',
        buildVersion: CURRENT_BUILD_VERSION
      });
    };

    sendPulse();
    const pulseTimer = setInterval(sendPulse, 20000);

    return () => {
      unsubscribeAll();
      unsubscribeSelf();
      clearInterval(pulseTimer);
    };
  }, [sessionUser, currentSessionId, isAuthReady]);

  // Navigation & Sub-views (Manager Console)
  const [managerView, setManagerView] = useState<'tickets' | 'access' | 'billing' | 'tenants' | 'broadcasts' | 'lostfound' | 'inventory' | 'rent' | 'payroll'>('tickets');

  // Filter States for Ticket Resolve Hub
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recency');
  const [invFilter, setInvFilter] = useState<'all' | 'occupied' | 'vacant' | 'single' | 'double' | 'triple'>('all');

  // Tenant directory sorting and filter states
  const [tenantSortKey, setTenantSortKey] = useState<'name' | 'roomNumber' | 'paymentStatus' | 'residingSince'>('name');
  const [tenantSortOrder, setTenantSortOrder] = useState<'asc' | 'desc'>('asc');
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [tenantViewMode, setTenantViewMode] = useState<'table' | 'grid'>('table');

  // Rent ledger & Payroll input states
  const [rentSubTab, setRentSubTab] = useState<'dues' | 'paid'>('dues');
  const [salName, setSalName] = useState('Amit Kumar');
  const [salRole, setSalRole] = useState('Operations Specialist');
  const [salAmount, setSalAmount] = useState('18000');
  const [salMonth, setSalMonth] = useState('June 2026');

  const handleEmployeeNameChange = (name: string) => {
    setSalName(name);
    if (name === "Amit Kumar") setSalRole("Operations Specialist");
    else if (name === "Saraswati Devi") setSalRole("Lead Housekeeper");
    else if (name === "Vikram Malhotra") setSalRole("Head Culinary Chef");
    else if (name === "Rajesh Patel") setSalRole("Maintenance Field Officer");
  };

  // Modals Open State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [showComplaintTooltip, setShowComplaintTooltip] = useState(false);
  const [isLostFoundModalOpen, setIsLostFoundModalOpen] = useState(false);
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isEditTenantModalOpen, setIsEditTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isAllotBedModalOpen, setIsAllotBedModalOpen] = useState(false);
  const [allotBedInitialRoom, setAllotBedInitialRoom] = useState('');
  const [allotBedInitialBed, setAllotBedInitialBed] = useState('');
  const [inspectingResidentId, setInspectingResidentId] = useState<string | null>(null);
  const [tenantIdToDelete, setTenantIdToDelete] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Broadcasts & Menu States
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeUrgency, setNewNoticeUrgency] = useState<'info' | 'important' | 'critical'>('info');

  const [menuSelectedDay, setMenuSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>(() => {
    const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  });
  const [breakfastMenuInput, setBreakfastMenuInput] = useState('');
  const [breakfastSubInput, setBreakfastSubInput] = useState('');
  const [lunchMenuInput, setLunchMenuInput] = useState('');
  const [lunchSubInput, setLunchSubInput] = useState('');
  const [dinnerMenuInput, setDinnerMenuInput] = useState('');
  const [dinnerSubInput, setDinnerSubInput] = useState('');

  const [tenantSelectedDay, setTenantSelectedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'>(() => {
    const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
  });
  const [roomsCollection, setRoomsCollection] = useState<RoomDoc[]>([]);

  // Seat Inventory definitions & RBAC checks
  const ROOM_DATABASE = React.useMemo(() => {
    let list = [];
    if (roomsCollection && roomsCollection.length > 0) {
      list = roomsCollection.map(r => ({
        roomNumber: r.roomNumber,
        type: r.roomType as "Single" | "Double" | "Triple",
        capacity: r.totalCapacity,
        monthlyRent: r.monthlyRent,
        vacantSpots: r.vacantSpots
      }));
    } else {
      list = [
        { roomNumber: "1", type: "Single" as const, capacity: 1, monthlyRent: "₹15,000", vacantSpots: 0 },
        { roomNumber: "2", type: "Double" as const, capacity: 2, monthlyRent: "₹19,000", vacantSpots: 1 },
        { roomNumber: "3", type: "Triple" as const, capacity: 3, monthlyRent: "₹8,500", vacantSpots: 1 },
        { roomNumber: "4", type: "Triple" as const, capacity: 3, monthlyRent: "₹8,500", vacantSpots: 0 },
        { roomNumber: "5", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 0 },
        { roomNumber: "6", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 1 },
        { roomNumber: "7", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 0 },
        { roomNumber: "8", type: "Single" as const, capacity: 1, monthlyRent: "₹15,000", vacantSpots: 0 },
        { roomNumber: "9", type: "Single" as const, capacity: 1, monthlyRent: "₹15,000", vacantSpots: 0 },
        { roomNumber: "11", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 0 },
        { roomNumber: "12", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 1 },
        { roomNumber: "13", type: "Triple" as const, capacity: 3, monthlyRent: "₹8,500", vacantSpots: 1 },
        { roomNumber: "14", type: "Single" as const, capacity: 1, monthlyRent: "₹15,000", vacantSpots: 0 },
        { roomNumber: "15", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 1 },
        { roomNumber: "16", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 1 },
        { roomNumber: "17", type: "Double" as const, capacity: 2, monthlyRent: "₹11,000", vacantSpots: 0 }
      ];
    }
    return [...list].sort((a, b) => {
      const numA = parseInt(a.roomNumber.replace(/\D/g, ''), 10);
      const numB = parseInt(b.roomNumber.replace(/\D/g, ''), 10);
      if (isNaN(numA) && isNaN(numB)) {
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });
  }, [roomsCollection]);

  const isDirector = React.useMemo(() => {
    if (!sessionUser || sessionUser.role !== 'manager') return false;
    const systemRole = sessionUser.info.systemRole;
    const privileges = sessionUser.info.privileges;
    const email = sessionUser.info.email?.toLowerCase();
    
    // Explicit exclusion check for Admin and Manager roles as requested:
    if (systemRole === 'Admin' || systemRole === 'Manager') return false;
    if (email === 'manager@zora.com' || email === 'admin_staff@zora.com' || email === 'staff@zora.com') return false;
    
    return (
      systemRole === 'Director' ||
      privileges === 'Full System' ||
      ['admin@zora.com', 'director@zora.com', 'nationamit@gmail.com'].includes(email) ||
      sessionUser.info.name?.toLowerCase().includes('director')
    );
  }, [sessionUser]);

  const seatInventory = React.useMemo(() => {
    let totalBeds = 0;
    let occupiedBeds = 0;
    
    const rooms = ROOM_DATABASE.map(room => {
      // Find all active tenants whose roomNumber matches the current room number
      const roomTenants = tenants.filter(t => {
        const tn = String(t.roomNumber).trim().toLowerCase();
        const rn = String(room.roomNumber).trim().toLowerCase();
        return tn === rn || tn === `room ${rn}` || tn === `r${rn}`;
      });
      
      const occupied = roomTenants.length;
      const vacant = Math.max(0, room.capacity - occupied);
      
      totalBeds += room.capacity;
      occupiedBeds += occupied;
      
      return {
        ...room,
        occupied,
        vacant,
        tenants: roomTenants
      };
    });
    
    return {
      totalBeds,
      occupiedBeds,
      vacantBeds: Math.max(0, totalBeds - occupiedBeds),
      rooms
    };
  }, [tenants, ROOM_DATABASE]);

  // Photo Editor sub-states
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');

  // Load current day of the week
  useEffect(() => {
    const days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayIndex = new Date().getDay();
    const mappedDay = days[currentDayIndex];
    setTenantSelectedDay(mappedDay);
    setMenuSelectedDay(mappedDay);
  }, []);

  // Update manager's inputs based on selection
  useEffect(() => {
    const activeMeal = meals.find(m => m.day === menuSelectedDay);
    if (activeMeal) {
      setBreakfastMenuInput(activeMeal.breakfastMenu || '');
      setBreakfastSubInput(activeMeal.breakfastSub || '');
      setLunchMenuInput(activeMeal.lunchMenu || '');
      setLunchSubInput(activeMeal.lunchSub || '');
      setDinnerMenuInput(activeMeal.dinnerMenu || '');
      setDinnerSubInput(activeMeal.dinnerSub || '');
    } else {
      setBreakfastMenuInput('');
      setBreakfastSubInput('');
      setLunchMenuInput('');
      setLunchSubInput('');
      setDinnerMenuInput('');
      setDinnerSubInput('');
    }
  }, [menuSelectedDay, meals]);

  // Load Real-Time Database Subscriptions on Boot
  useEffect(() => {
    // 1. Clock timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    if (!isAuthReady) {
      return () => {
        clearInterval(timer);
      };
    }

    // 2. Tenants sync
    const unsubscribeTenants = dbService.subscribeTenants((list) => {
      setTenants(list);
    });

    // 2b. Rooms sync
    const unsubscribeRooms = dbService.subscribeRooms((list) => {
      setRoomsCollection(list);
    });

    // 3. Tickets sync
    let lastTicketCount = -1;
    const unsubscribeTickets = dbService.subscribeTickets((list) => {
      setTickets(list);
      // Play a synthesizer blip if tickets count increases (meaning a new ticket has been raised)
      if (lastTicketCount !== -1 && list.length > lastTicketCount) {
        addToast("New Incident Ticket", "A new ticket has been raise-submitted to Zora Gate.", "warning");
        playBuzzer();
        sendPushNotification("Zora Stays Alerts", "A new ticket has been raised.");
      }
      lastTicketCount = list.length;
    });

    // 4. Notifications sync
    let lastNotificationCount = -1;
    const unsubscribeNotifications = dbService.subscribeNotifications((list) => {
      setNotifications(list);
      // Play sound and toast only if a new notification arrives
      if (lastNotificationCount !== -1 && list.length > lastNotificationCount) {
        const latest = list[0]; // Sorted desc
        if (latest) {
          addToast(latest.title, latest.message, latest.recipientRole === 'manager' ? 'warning' : 'success');
          playCyberBlip();
          sendPushNotification(latest.title, latest.message);
        }
      }
      lastNotificationCount = list.length;
    });

    // 5. Gate passes sync
    const unsubscribeGatePasses = dbService.subscribeGatePasses((list) => {
      setGatePasses(list);
    });

    // 6. Notices sync
    const unsubscribeNotices = dbService.subscribeNotices((list) => {
      setNotices(list);
    });

    // 7. Meals sync
    const unsubscribeMeals = dbService.subscribeMeals((list) => {
      setMeals(list);
    });

    // 8. Lost & Found sync
    const unsubscribeLostFound = dbService.subscribeLostFoundItems((list) => {
      setLostFoundItems(list);
    });

    // 9. Rent Payments sync
    const unsubscribeRentPayments = dbService.subscribeRentPayments((list) => {
      setRentPayments(list);
    });

    // 10. Salaries sync
    const unsubscribeSalaries = dbService.subscribeSalaries((list) => {
      setSalaries(list);
    });

    return () => {
      clearInterval(timer);
      unsubscribeTenants();
      unsubscribeRooms();
      unsubscribeTickets();
      unsubscribeNotifications();
      unsubscribeGatePasses();
      unsubscribeNotices();
      unsubscribeMeals();
      unsubscribeLostFound();
      unsubscribeRentPayments();
      unsubscribeSalaries();
    };
  }, [isAuthReady]);

  // Self-correcting Rooms vacancy count in Firestore matching real occupants
  useEffect(() => {
    if (!sessionUser || (sessionUser.role !== 'manager' && sessionUser.role !== 'employee')) return;
    if (roomsCollection.length === 0 || tenants.length === 0) return;
    
    // Let's check which rooms need updates to their vacancy spots
    const roomsToUpdate = roomsCollection.map(r => {
      const roomTenants = tenants.filter(t => {
        const tn = String(t.roomNumber).trim().toLowerCase();
        const rn = String(r.roomNumber).trim().toLowerCase();
        return tn === rn || tn === `room ${rn}` || tn === `r${rn}`;
      });
      const calculatedVacant = Math.max(0, r.totalCapacity - roomTenants.length);
      if (r.vacantSpots !== calculatedVacant) {
        return { ...r, vacantSpots: calculatedVacant };
      }
      return null;
    }).filter((r): r is RoomDoc => r !== null);

    if (roomsToUpdate.length > 0) {
      roomsToUpdate.forEach(async (r) => {
        await dbService.saveRoom(r);
      });
    }
  }, [tenants, roomsCollection, sessionUser]);

  // Synchronize Rent tab and Smart Billing/Tenant payments in real-time
  useEffect(() => {
    if (!sessionUser || (sessionUser.role !== 'manager' && sessionUser.role !== 'employee')) return;
    if (tenants.length === 0 || !isAuthReady) return;

    const reconcileRentData = async () => {
      for (const t of tenants) {
        const paymentId = `RENT-${t.tenantId}-2026-06`;
        const existingPayment = rentPayments.find(p => p.id === paymentId);

        if (!existingPayment) {
          // Initialize missing rent payment to match tenant status
          const nPay: RentPayment = {
            id: paymentId,
            tenantId: t.tenantId,
            tenantName: t.name,
            roomNumber: t.roomNumber,
            amount: t.rentAmount || 11000,
            month: "June 2026",
            status: t.paymentStatus === 'paid' ? 'paid' : 'pending',
            paidAt: t.paymentStatus === 'paid' ? (t.createdAt || new Date().toISOString()) : undefined
          };
          await dbService.saveRentPayment(nPay);
        } else {
          // Sync status (paid takes precedence to prevent accidental reversals)
          if (t.paymentStatus === 'paid' && existingPayment.status !== 'paid') {
            await dbService.saveRentPayment({
              ...existingPayment,
              status: 'paid',
              paidAt: existingPayment.paidAt || new Date().toISOString()
            });
          } else if (existingPayment.status === 'paid' && t.paymentStatus !== 'paid') {
            await dbService.saveTenant({
              ...t,
              paymentStatus: 'paid'
            });
          } else {
            // Check if tenant information on the pending payment receipt is out-of-sync
            if (existingPayment.tenantName !== t.name || 
                existingPayment.roomNumber !== t.roomNumber || 
                existingPayment.amount !== (t.rentAmount || 11000)) {
              await dbService.saveRentPayment({
                ...existingPayment,
                tenantName: t.name,
                roomNumber: t.roomNumber,
                amount: t.rentAmount || 11000
              });
            }
          }
        }
      }
    };

    reconcileRentData();
  }, [tenants, rentPayments, isAuthReady, sessionUser]);

  // 30-Second Auto-Refresh Engine for Resolver Hub
  useEffect(() => {
    if (!isAuthReady) return;
    if (!autoRefresh) {
      setRefreshCountdown(30);
      return;
    }
    const countTimer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countTimer);
  }, [autoRefresh, isAuthReady]);

  // Sync session user data on directory edits in real-time
  useEffect(() => {
    if (!isAuthReady || !sessionUser || sessionUser.role !== 'tenant') return;

    const unsubscribe = dbService.subscribeTenantDoc(sessionUser.info.tenantId, (liveTenant) => {
      if (liveTenant) {
        setSessionUser(prev => {
          if (!prev) return null;
          // Deep-compare fields to prevent redundant renders or state loops
          const infoChanged = JSON.stringify(liveTenant) !== JSON.stringify(prev.info);
          if (infoChanged) {
            return { role: 'tenant', info: liveTenant };
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [sessionUser?.info?.tenantId, isAuthReady]);

  // Utility to push customized in-app toasts
  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const freshToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      message,
      type
    };
    setToasts(prev => [freshToast, ...prev].slice(0, 5));
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Auth Handling
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Credentials are required');
      return;
    }

    if (loginRole === 'manager') {
      const emailLower = loginEmail.toLowerCase();
      if ((emailLower === 'nationamit@gmail.com' || emailLower === 'admin@zora.com' || emailLower === 'director@zora.com') && loginPassword === 'password123') {
        setSessionUser({
          role: 'manager',
          info: { name: 'Support Director', email: loginEmail, privileges: 'Full System', systemRole: 'Director' }
        });
        requestPushPermission();
        playSuccessTone();
        addToast("Director Signed In", "Director central command portal secure session booted.", "success");
      } else if (emailLower === 'manager@zora.com' && loginPassword === 'password123') {
        setSessionUser({
          role: 'manager',
          info: { name: 'Property Manager', email: loginEmail, privileges: 'Operational Only', systemRole: 'Manager' }
        });
        requestPushPermission();
        playSuccessTone();
        addToast("Manager Signed In", "Manager limited operational portal booted.", "success");
      } else if ((emailLower === 'admin_staff@zora.com' || emailLower === 'staff@zora.com') && loginPassword === 'password123') {
        setSessionUser({
          role: 'manager',
          info: { name: 'System Admin', email: loginEmail, privileges: 'Admin Access Only', systemRole: 'Admin' }
        });
        requestPushPermission();
        playSuccessTone();
        addToast("Admin Signed In", "Administrative staff access portal booted.", "success");
      } else {
        setLoginError('Invalid Administrator, Manager or Staff credentials.');
      }
    } else if (loginRole === 'employee') {
      const emailLower = loginEmail.toLowerCase();
      let matchedEmp = null;
      if (emailLower === 'amit@zora.com' || emailLower === 'employee@zora.com' || emailLower === 'nationamit@gmail.com') {
        matchedEmp = { name: "Amit Kumar", role: "Operations Specialist", email: emailLower };
      } else if (emailLower === 'saraswati@zora.com' || emailLower === 'housekeeping@zora.com') {
        matchedEmp = { name: "Saraswati Devi", role: "Lead Housekeeper", email: emailLower };
      } else if (emailLower === 'vikram@zora.com' || emailLower === 'chef@zora.com') {
        matchedEmp = { name: "Vikram Malhotra", role: "Head Culinary Chef", email: emailLower };
      } else if (emailLower === 'rajesh@zora.com' || emailLower === 'maintenance@zora.com') {
        matchedEmp = { name: "Rajesh Patel", role: "Maintenance Field Officer", email: emailLower };
      }

      if (matchedEmp && loginPassword === 'password123') {
        setSessionUser({
          role: 'employee',
          info: matchedEmp
        });
        requestPushPermission();
        playSuccessTone();
        addToast("Employee Authenticated", `Welcome back to work, ${matchedEmp.name}!`, "success");
      } else {
        setLoginError('Invalid Employee credentials or password.');
      }
    } else {
      // Check Tenant Directory
      const matched = tenants.find(t => t.mailId.toLowerCase() === loginEmail.toLowerCase() && t.password === loginPassword);
      if (matched) {
        setSessionUser({
          role: 'tenant',
          info: matched
        });
        requestPushPermission();
        playSuccessTone();
        addToast("Resident Authenticated", `Welcome back to your room, ${matched.name}!`, "success");
        if (!matched.onboarded) {
          setIsOnboardingModalOpen(true);
        }
      } else {
        setLoginError('No matching resident email/password found.');
      }
    }
  };

  // Fast testing sign-in buttons (extreme usability Sandbox mode)
  const quickLogIn = (role: 'tenant' | 'manager' | 'employee', email: string) => {
    setLoginRole(role);
    setLoginEmail(email);
    setLoginPassword('password123');
    setTimeout(() => {
      // Triggers login
      if (role === 'manager') {
        const emailLower = email.toLowerCase();
        let name = 'Property Director';
        let privileges = 'Full System';
        let systemRole = 'Director';
        
        if (emailLower === 'manager@zora.com') {
          name = 'Property Manager';
          privileges = 'Operational Only';
          systemRole = 'Manager';
        } else if (emailLower === 'admin_staff@zora.com' || emailLower === 'staff@zora.com') {
          name = 'System Admin';
          privileges = 'Admin Access Only';
          systemRole = 'Admin';
        }

        setSessionUser({
          role: 'manager',
          info: { name, email, privileges, systemRole }
        });
        playSuccessTone();
        addToast(`${systemRole} Signed In`, `${name} console access granted in sandbox mode.`, "success");
      } else if (role === 'employee') {
        const emailLower = email.toLowerCase();
        let name = "Amit Kumar";
        let empRole = "Operations Specialist";
        if (emailLower === 'chef@zora.com' || emailLower === 'vikram@zora.com') {
          name = "Vikram Malhotra";
          empRole = "Head Culinary Chef";
        } else if (emailLower === 'housekeeping@zora.com' || emailLower === 'saraswati@zora.com') {
          name = "Saraswati Devi";
          empRole = "Lead Housekeeper";
        } else if (emailLower === 'maintenance@zora.com' || emailLower === 'rajesh@zora.com') {
          name = "Rajesh Patel";
          empRole = "Maintenance Field Officer";
        }

        setSessionUser({
          role: 'employee',
          info: { name, role: empRole, email: emailLower }
        });
        playSuccessTone();
        addToast("Employee Signed In", `${name} employee portal secure session booted.`, "success");
      } else {
        const matched = tenants.find(t => t.mailId.toLowerCase() === email.toLowerCase());
        if (matched) {
          setSessionUser({ role: 'tenant', info: matched });
          playSuccessTone();
          addToast("Resident Authenticated", `Welcome back, ${matched.name}!`, "success");
          if (!matched.onboarded) {
            setIsOnboardingModalOpen(true);
          }
        }
      }
    }, 105);
  };

  const handleLogout = async () => {
    playCyberBlip();
    if (auth && dbService.isRealFirebase()) {
      try {
        await signOut(auth);
        console.log("Firebase Auth signed out successfully via signOut() trigger.");
      } catch (err) {
        console.error("Firebase Auth signout error: ", err);
      }
    }
    // Always trigger local reset when logging out to guarantee session is destroyed cleanly
    resetAppState();
  };

  const handleCompleteOnboarding = async (updatedTenant: Tenant) => {
    try {
      await dbService.saveTenant(updatedTenant);
      // Trigger instant update of active session so UI re-evaluates
      setSessionUser({ role: 'tenant', info: updatedTenant });
      setIsOnboardingModalOpen(false);
      playSuccessTone();
      addToast("Protocol Active", "Resident onboarding completed! Full portal access verified.", "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to Save", "Could not synchronize onboarding details with cloud.", "warning");
    }
  };

  // Action: Raise Tenant Incident Ticket
  const handleRaiseTicket = async (title: string, category: Ticket['category'], description: string, priority: Ticket['priority']) => {
    if (!sessionUser || sessionUser.role !== 'tenant') return;
    
    const tenant = sessionUser.info;
    const ticketId = "TKT-" + Math.floor(1000 + Math.random() * 9000);
    
    const newTicket: Ticket = {
      id: ticketId,
      tenantId: tenant.tenantId,
      tenantName: tenant.name,
      roomNumber: tenant.roomNumber,
      category,
      title,
      description,
      status: 'pending',
      priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followupCount: 0,
      comments: []
    };

    // Save ticket
    await dbService.saveTicket(newTicket);

    // Save notification for managers
    const notificationId = "NOT-" + Math.floor(10000 + Math.random() * 90000);
    const newNotif: Notification = {
      id: notificationId,
      recipientRole: 'manager',
      title: `New (${priority.toUpperCase()}) Issue raised`,
      message: `${tenant.name} raised issue in Room ${tenant.roomNumber}: "${title}"`,
      ticketId: ticketId,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(newNotif);

    playSuccessTone();
    addToast("Incident Logged", `Ticket ${ticketId} raised successfully under category: ${category}.`, "success");
  };

  // Action: Follow-up incident
  const handleFollowupTicket = async (ticketId: string) => {
    const original = tickets.find(t => t.id === ticketId);
    if (!original) return;

    const newPulseCount = original.followupCount + 1;
    const updatedTicket: Ticket = {
      ...original,
      followupCount: newPulseCount,
      updatedAt: new Date().toISOString()
    };

    await dbService.saveTicket(updatedTicket);

    // Alert manager
    const notif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole: 'manager',
      title: `High Follow-up: ${original.id}`,
      message: `Tenant ${original.tenantName} trigger-spurred follow up (Count: ${newPulseCount}) on: "${original.title}"`,
      ticketId,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(notif);

    playBuzzer();
    addToast("Follow-up Spur Received", "Support Desk manager notified of priority escalation.", "warning");
    
    // Update active modal inspection reference if open
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
  };

  // Action: Write activity log/comment in ticket
  const handleAddComment = async (ticketId: string, text: string) => {
    if (!sessionUser) return;
    const authorRole = sessionUser.role;
    const authorName = authorRole === 'manager' ? 'Support Management' : sessionUser.info.name;

    const original = tickets.find(t => t.id === ticketId);
    if (!original) return;

    const newComment: TicketComment = {
      id: "COM-" + Math.floor(1000 + Math.random() * 9000),
      authorRole,
      authorName,
      text,
      createdAt: new Date().toISOString()
    };

    const updatedTicket: Ticket = {
      ...original,
      updatedAt: new Date().toISOString(),
      comments: [...original.comments, newComment]
    };

    await dbService.saveTicket(updatedTicket);

    // Dynamic Notifications
    const recipientRole: 'tenant' | 'manager' = authorRole === 'tenant' ? 'manager' : 'tenant';
    const notif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole,
      recipientId: authorRole === 'manager' ? original.tenantId : undefined,
      title: `New Comment Thread Reply`,
      message: `${authorName}: "${text.length > 50 ? text.substring(0, 47) + '...' : text}"`,
      ticketId,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(notif);

    // Update active modal inspect
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
    playCyberBlip();
  };

  // Action: Manager modify ticket status & resolution log
  const handleUpdateTicketStatus = async (ticketId: string, status: Ticket['status'], resolutionLog?: string) => {
    const original = tickets.find(t => t.id === ticketId);
    if (!original) return;

    let updatedComments = [...original.comments];
    if (resolutionLog) {
      const actionsLog: TicketComment = {
        id: "COM-" + Math.floor(1000 + Math.random() * 9000),
        authorRole: 'manager',
        authorName: 'Support Director (Resolution Log)',
        text: `💡 STATUS TRANSITION TO [${status.toUpperCase()}]: ${resolutionLog}`,
        createdAt: new Date().toISOString()
      };
      updatedComments.push(actionsLog);
    }

    const updatedTicket: Ticket = {
      ...original,
      status,
      updatedAt: new Date().toISOString(),
      comments: updatedComments
    };

    await dbService.saveTicket(updatedTicket);

    // Send instant notification to the specific tenant
    const notif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole: 'tenant',
      recipientId: original.tenantId,
      title: `Ticket Status Updated`,
      message: `Your ticket "${original.title}" has been updated to: ${status.toUpperCase()}`,
      ticketId,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(notif);

    playSuccessTone();
    addToast("State Synchronized", `Ticket status is now ${status}.`, "success");

    // Update active modal inspect
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
  };

  // Action: Assign ticket to staff
  const handleAssignTicket = async (ticketId: string, employeeName: string) => {
    const original = tickets.find(t => t.id === ticketId);
    if (!original) return;

    let updatedComments = [...original.comments];
    const assignLog: TicketComment = {
      id: "COM-" + Math.floor(1000 + Math.random() * 9000),
      authorRole: 'manager',
      authorName: 'Support Director (Assignment Log)',
      text: employeeName 
        ? `📋 ASSIGNED INCIDENT TO STAFF: ${employeeName}`
        : `📋 REMOVED STAFF ASSIGNMENT`,
      createdAt: new Date().toISOString()
    };
    updatedComments.push(assignLog);

    const updatedTicket: Ticket = {
      ...original,
      assignedTo: employeeName || undefined,
      updatedAt: new Date().toISOString(),
      comments: updatedComments
    };

    await dbService.saveTicket(updatedTicket);

    playSuccessTone();
    addToast(
      employeeName ? "Dispatch Active" : "Assignment Cleared", 
      employeeName ? `${employeeName} assigned as responder.` : "Incident back in dispatch queue.", 
      "success"
    );

    // Update active modal inspect
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
  };

  const handleMarkRentAsPaid = async (paymentId: string) => {
    const original = rentPayments.find(p => p.id === paymentId);
    if (!original) return;

    const updated: RentPayment = {
      ...original,
      status: 'paid',
      paidAt: new Date().toISOString()
    };

    await dbService.saveRentPayment(updated);

    // Real-time sync: also update corresponding Tenant status
    const matchedTenant = tenants.find(t => t.tenantId === original.tenantId);
    if (matchedTenant) {
      const updatedTenant = { ...matchedTenant, paymentStatus: 'paid' as const };
      await dbService.saveTenant(updatedTenant);
    }

    playSuccessTone();
    addToast("Payment Recorded", `Rent for ${original.tenantName} is marked as paid.`, "success");
  };

  const handleRecordSalary = async (salary: Omit<Salary, 'id' | 'createdAt'>) => {
    const newSalary: Salary = {
      ...salary,
      id: "SAL-" + Math.floor(10000 + Math.random() * 90000),
      createdAt: new Date().toISOString()
    };

    await dbService.saveSalary(newSalary);
    playSuccessTone();
    addToast("Salary Disbursed", `Recorded salary payment of ₹${salary.amountPaid} for ${salary.employeeName}.`, "success");
  };

  // Action: Manager Quick Fast-Resolve ticket
  const handleFastResolve = async (ticketId: string) => {
    const original = tickets.find(t => t.id === ticketId);
    if (!original) return;

    const resolvedComment: TicketComment = {
      id: "COM-" + Math.floor(1000 + Math.random() * 9000),
      authorRole: 'manager',
      authorName: 'Support Director',
      text: 'Ticket Resolved',
      createdAt: new Date().toISOString()
    };

    const updatedTicket: Ticket = {
      ...original,
      status: 'resolved',
      updatedAt: new Date().toISOString(),
      comments: [...original.comments, resolvedComment]
    };

    await dbService.saveTicket(updatedTicket);

    // Send instant standardized 'resolved' system notification to the tenant
    const notif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole: 'tenant',
      recipientId: original.tenantId,
      title: `Ticket Resolved`,
      message: `Your ticket "${original.title}" has been successfully resolved: Ticket Resolved`,
      ticketId,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(notif);

    playSuccessTone();
    addToast("Ticket Resolved", `Ticket "${original.title}" has been fast-resolved.`, "success");

    // Update active modal inspect
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
  };

  // Action: Escalate Ticket to Executive Director if pending > 24 hours
  const handleEscalateToDirector = async (ticketId: string) => {
    const original = tickets.find(t => t.id === ticketId);
    if (!original) return;

    const updatedTicket: Ticket = {
      ...original,
      priority: 'urgent',
      updatedAt: new Date().toISOString(),
      followupCount: original.followupCount + 1,
    };

    await dbService.saveTicket(updatedTicket);

    // Save Director Escalation Alert for managers
    const notif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole: 'manager',
      title: `🚨 INCIDENT ESCALATED TO DIRECTOR 🚨`,
      message: `Tenant ${original.tenantName} (Room ${original.roomNumber}) escalated Ticket ${ticketId} [${original.category.toUpperCase()}] to Director level priority. It has been pending for over 24 hours without resolution.`,
      ticketId: ticketId,
      createdAt: new Date().toISOString(),
      read: false
    };

    await dbService.saveNotification(notif);
    playSuccessTone();
    addToast("Director Escalation Cleared", `Incident ${ticketId} escalated successfully to Executive Director portal!`, "success");

    // Update active modal inspect if it's currently selected
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(updatedTicket);
    }
  };

  // Action: Manager enroll new resident single
  const handleEnrollTenant = async (newTenant: Tenant) => {
    await dbService.saveTenant(newTenant);
    playSuccessTone();
  };

  // Action: Manager save updated tenant details
  const handleSaveTenant = async (updatedTenant: Tenant) => {
    await dbService.saveTenant(updatedTenant);
    playSuccessTone();
    addToast("Tenant Roster Synchronized", `Resident ${updatedTenant.name}'s parameters have been updated.`, "success");
  };

  // Action: Allot/Reassign Bed & Room assignment for Guest
  const handleAllotBed = async (tenantId: string, roomNumber: string, bedNumber: string, sharingType: string) => {
    const resident = tenants.find(t => t.tenantId === tenantId);
    if (!resident) return;
    const updatedTenant: Tenant = {
      ...resident,
      roomNumber,
      bedNumber,
      sharingType
    };
    await dbService.saveTenant(updatedTenant);
    playSuccessTone();
    addToast("Seat Allotment Synchronized", `${resident.name} has been successfully assigned to Room ${roomNumber} (${bedNumber}).`, "success");
  };

  // Action: Manager enroll multiple residents (CSV bulk upload)
  const handleBulkEnrollTenants = async (newTenants: Tenant[]) => {
    for (const t of newTenants) {
      await dbService.saveTenant(t);
    }
    playSuccessTone();
    addToast("Log Entries Synchronized", `Successfully batch enrolled ${newTenants.length} profiles.`, "success");
  };

  // --- BRAND NEW: LOST & FOUND ACTIONS ---
  const handleCreateLostFoundItem = async (data: {
    title: string;
    description: string;
    type: 'lost' | 'found';
    location: string;
    dateStr: string;
    photoUrl: string;
  }) => {
    if (!sessionUser) return;
    const id = `LF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newItem: LostFoundItem = {
      id,
      title: data.title,
      description: data.description,
      type: data.type,
      location: data.location,
      dateStr: data.dateStr,
      status: 'active',
      tenantId: sessionUser.role === 'tenant' ? sessionUser.info.tenantId : 'manager',
      tenantName: sessionUser.role === 'tenant' ? sessionUser.info.name : 'PG Corporate Operations',
      roomNumber: sessionUser.role === 'tenant' ? sessionUser.info.roomNumber : 'Front Desk',
      photoUrl: data.photoUrl,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveLostFoundItem(newItem);
      addToast("Community Post Dispatched", `Property logged under catalog #${id}.`, "success");
      
      const systemNotification: Notification = {
        id: `NOT-${Math.floor(10000 + Math.random() * 90000)}`,
        recipientRole: 'tenant',
        title: `Community Alert: ${data.type === 'lost' ? 'Lost' : 'Found'} Item`,
        message: `${sessionUser.role === 'tenant' ? sessionUser.info.name : 'Office'} posted: "${data.title}" located near "${data.location}".`,
        createdAt: new Date().toISOString(),
        read: false
      };
      await dbService.saveNotification(systemNotification);
    } catch (err: any) {
      addToast("Broadcast Error", "Error posting item: " + err.message, "error");
    }
  };

  const handleToggleLostFoundStatus = async (item: LostFoundItem) => {
    const updatedItem: LostFoundItem = {
      ...item,
      status: item.status === 'active' ? 'resolved' : 'active'
    };
    try {
      await dbService.saveLostFoundItem(updatedItem);
      addToast("Property Catalog Sync'd", `Item #${item.id} is now ${updatedItem.status.toUpperCase()}`, "success");
    } catch (err: any) {
      addToast("Sync Error", err.message, "error");
    }
  };

  const handleDeleteLostFoundItem = async (id: string) => {
    try {
      await dbService.deleteLostFoundItem(id);
      addToast("Property Removed", `Item #${id} cleared from records.`, "warning");
    } catch (err: any) {
      addToast("Deletion Error", err.message, "error");
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      const tenant = tenants.find(t => t.tenantId === tenantId);
      const name = tenant ? tenant.name : tenantId;
      await dbService.deleteTenant(tenantId);
      addToast("Tenant Enrolment Permacleared", `${name} has been removed from the directory.`, "warning");
      playCyberBlip();
      setInspectingResidentId(null);
      setTenantIdToDelete(null);
    } catch (err: any) {
      addToast("Deletion Error", err.message, "error");
    }
  };

  const handleSaveRoom = async (newRoom: RoomDoc) => {
    try {
      await dbService.saveRoom(newRoom);
      addToast("Room Unit Provisioned", `Room ${newRoom.roomNumber} has been added to the PG directory.`, "success");
      playSuccessTone();
    } catch (err: any) {
      addToast("Error Provisioning Room", err.message, "error");
    }
  };

  // Action: Submit Gate Pass
  const handleSubmitGatePass = async (
    type: 'leave' | 'late-entry' | 'visitor',
    departureDate: string,
    returnDate: string,
    reason: string,
    visitorName?: string,
    visitorRelation?: string,
    visitDate?: string,
    visitTime?: string
  ) => {
    if (!sessionUser || sessionUser.role !== 'tenant') return;
    const tenant = sessionUser.info;
    const passId = "GP-" + Math.floor(1000 + Math.random() * 9000);

    const newPass: GatePass = {
      id: passId,
      tenantId: tenant.tenantId,
      tenantName: tenant.name,
      roomNumber: tenant.roomNumber,
      type,
      departureDate,
      returnDate,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      visitorName,
      visitorRelation,
      visitDate,
      visitTime
    };

    await dbService.saveGatePass(newPass);

    // Save notify for manager
    const newNotif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole: 'manager',
      title: type === 'visitor' ? `New Visitor Pass Requested` : `New Gate Pass Requested`,
      message: type === 'visitor'
        ? `${tenant.name} requested visitor pass for ${visitorName} (${visitorRelation}) on ${visitDate} at ${visitTime}`
        : `${tenant.name} requested ${type} permission from ${departureDate} to ${returnDate}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(newNotif);

    playSuccessTone();
    addToast(
      type === 'visitor' ? "Visitor Pass Requested" : "Gate Pass Logged",
      type === 'visitor' 
        ? `Visitor pass for ${visitorName} was submitted for manager review.`
        : `Your request ${passId} has been submitted for manager review.`,
      "success"
    );
  };

  // Action: Resolve Gate Pass (Approve / Reject)
  const handleResolveGatePass = async (passId: string, action: 'approved' | 'rejected') => {
    const originalPass = gatePasses.find(gp => gp.id === passId);
    if (!originalPass) return;

    const updatedPass: GatePass = {
      ...originalPass,
      status: action
    };

    await dbService.saveGatePass(updatedPass);

    // Get the corresponding tenant
    const matchedTenant = tenants.find(t => t.tenantId === originalPass.tenantId);
    if (matchedTenant) {
      const updatedTenant: Tenant = {
        ...matchedTenant,
        statusBadge: action === 'approved' 
          ? (originalPass.type === 'leave' ? 'leave' : 'late')
          : 'hostel'
      };
      await dbService.saveTenant(updatedTenant);
    }

    // Send notification to Tenant
    const notif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole: 'tenant',
      recipientId: originalPass.tenantId,
      title: `Gate Pass Request ${action.toUpperCase()}`,
      message: `Your ${originalPass.type} permit (${passId}) has been ${action} by the Support Director.`,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(notif);

    playSuccessTone();
    addToast(`Pass ${action === 'approved' ? 'Approved' : 'Rejected'}`, `Gate pass ${passId} has been successfully settled.`, action === 'approved' ? 'success' : 'warning');
  };

  // Action: Publish Board Notice
  const handlePublishNotice = async (title: string, content: string, urgency: 'info' | 'important' | 'critical') => {
    const noticeId = "NOT-" + Math.floor(1000 + Math.random() * 9000);
    const newNotice: Notice = {
      id: noticeId,
      title,
      content,
      urgency,
      createdAt: new Date().toISOString()
    };

    await dbService.saveNotice(newNotice);

    // Push notification to all tenants
    const notif: Notification = {
      id: "NOT-" + Math.floor(10000 + Math.random() * 90055),
      recipientRole: 'tenant',
      title: `🔔 Notice Board Announcement`,
      message: `New Notice: "${title}" has been pinned. Check board for details.`,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(notif);

    playSuccessTone();
    addToast("Announcement Published", `Broadcasting notice dashboard alert: "${title}"`, "success");
  };

  // Action: Delete Board Notice
  const handleDeleteNotice = async (id: string) => {
    await dbService.deleteNotice(id);
    playCyberBlip();
    addToast("Announcement Deleted", `Notice announcement removed from dashboard.`, "info");
  };

  // Action: Upvote/Downvote Meal Feedback
  const handleVoteMeal = async (day: string, meal: 'breakfast' | 'lunch' | 'dinner', voteType: 'up' | 'down') => {
    await dbService.saveMealFeedback(day, meal, voteType);
    playCyberBlip();
    addToast("Feedback Recorded", `Your ${voteType}vote on today's ${meal} has been synchronized. Thank you!`, "success");
  };

  // Helper: Download a raw CSV string
  const downloadCSVFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Export Successful", `${filename} has been exported and downloaded.`, "success");
  };

  // Export: Tenants Roster CSV
  const exportTenantsToCSV = () => {
    const headers = [
      'Tenant ID',
      'Name',
      'Residing Since',
      'Room Number',
      'Bed Number',
      'Assigned Bed',
      'Sharing Type',
      'Phone Number',
      'Gender',
      'Email ID',
      'Status Badge',
      'Rent Amount',
      'Payment Status',
      'Due Date',
      'Onboarded',
      'Emergency Contact',
      'Security Deposit Amount',
      'Security Deposit Status',
      'ID Proof Type',
      'ID Proof Status'
    ];

    const rows = tenants.map(t => [
      t.tenantId || '',
      t.name || '',
      t.residingSince || '',
      t.roomNumber || '',
      t.bedNumber || '',
      t.assignedBed || '',
      t.sharingType || '',
      t.phoneNumber || '',
      t.gender || '',
      t.mailId || '',
      t.statusBadge || '',
      t.rentAmount || 0,
      t.paymentStatus || '',
      t.dueDate || '',
      t.onboarded ? 'Yes' : 'No',
      t.emergencyContact || '',
      t.securityDepositAmount || 0,
      t.securityDepositStatus || '',
      t.idProofType || '',
      t.idProofStatus || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    downloadCSVFile(csvContent, `Zora_Tenants_Roster_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Export: Rooms Inventory CSV
  const exportRoomsToCSV = () => {
    const headers = [
      'Room Number',
      'Room Type',
      'Monthly Rent',
      'Total Capacity',
      'Vacant Spots',
      'Occupied Spots'
    ];

    const rows = roomsCollection.map(r => {
      const occupied = r.totalCapacity - r.vacantSpots;
      return [
        r.roomNumber || '',
        r.roomType || '',
        r.monthlyRent || '',
        r.totalCapacity || 0,
        r.vacantSpots || 0,
        occupied >= 0 ? occupied : 0
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    downloadCSVFile(csvContent, `Zora_Rooms_Inventory_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Export: Rent Ledger CSV
  const exportRentLedgerToCSV = () => {
    const headers = [
      'Payment ID',
      'Tenant ID',
      'Tenant Name',
      'Room Number',
      'Month',
      'Amount',
      'Status',
      'Paid At'
    ];

    const rows = rentPayments.map(p => [
      p.id || '',
      p.tenantId || '',
      p.tenantName || '',
      p.roomNumber || '',
      p.month || '',
      p.amount || 0,
      p.status || '',
      p.paidAt || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    downloadCSVFile(csvContent, `Zora_Rent_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
  };

  // Action: Send Flashing Overdue Bill Reminders
  const handleSendBillReminder = async (tenantId: string) => {
    const matched = tenants.find(t => t.tenantId === tenantId);
    if (!matched) return;

    const reminderNotif: Notification = {
      id: "NOT-BILL-" + Math.floor(10000 + Math.random() * 90000),
      recipientRole: 'tenant',
      recipientId: tenantId,
      title: `⚡ CRITICAL OVERDUE RENT REMINDER`,
      message: `This is a high-visibility alert regarding your pending PG Rent of ₹${matched.rentAmount.toLocaleString('en-IN')}. Due date was: ${matched.dueDate}. Kindly pay immediately to avoid penalty.`,
      createdAt: new Date().toISOString(),
      read: false
    };
    await dbService.saveNotification(reminderNotif);

    playBuzzer();
    addToast("Bill Reminder Broadcasted", `Neon billing warning successfully issued to ${matched.name}.`, "warning");
  };

  // Filter manager tickets
  const filteredTickets = tickets.filter(ticket => {
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesRoom = !filterRoom || ticket.roomNumber.toLowerCase().includes(filterRoom.toLowerCase());
    const matchesSearch = !searchQuery || 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ticket.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesRoom && matchesSearch;
  });

  // Sort manager tickets by Priority (Urgent to Low) or Recency (Newest to Oldest)
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const weightA = priorityWeights[a.priority?.toLowerCase() || 'low'] || 0;
      const weightB = priorityWeights[b.priority?.toLowerCase() || 'low'] || 0;
      if (weightB !== weightA) {
        return weightB - weightA; // Urgent first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first fallback
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
    }
  });

  // Recharts Pie Chart Data: Group tickets by category
  const categoriesMap: Record<string, { name: string; value: number; color: string }> = {
    food: { name: 'Food & Meals', value: 0, color: '#F15A24' },
    housekeeping: { name: 'Housekeeping', value: 0, color: '#E29B7A' },
    laundry: { name: 'Laundry Service', value: 0, color: '#7C5E50' },
    maintenance: { name: 'Maintenance', value: 0, color: '#4E2817' },
    sales: { name: 'Billing & Sales', value: 0, color: '#D24C19' },
    other: { name: 'Other Concerns', value: 0, color: '#938176' },
  };

  tickets.forEach(ticket => {
    const cat = ticket.category?.toLowerCase();
    if (categoriesMap[cat]) {
      categoriesMap[cat].value += 1;
    } else if (categoriesMap['other']) {
      categoriesMap['other'].value += 1;
    }
  });

  const pieData = Object.values(categoriesMap).filter(item => item.value > 0);

  // Recharts Bar Chart Data: Daily Influx Trends for Current Week (Last 7 Days roll to guarantee trend rendering)
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    return d;
  });

  const barData = last7Days.map(date => {
    const dateStr = date.toDateString();
    const label = date.toLocaleDateString([], { weekday: 'short' });
    const count = tickets.filter(ticket => {
      const tDate = new Date(ticket.createdAt);
      return tDate.toDateString() === dateStr;
    }).length;
    return {
      day: label,
      count,
      dateFull: date.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'long' })
    };
  });

  if (!isAuthReady) {
    return (
      <div className={`min-h-screen ${sessionUser ? 'bg-[#FAF6F0]' : 'bg-[#0E0B0A]'} flex flex-col items-center justify-center font-sans select-none transition-colors duration-500`}>
        <div className="relative flex flex-col items-center">
          <div className={`absolute inset-0 ${sessionUser ? 'bg-[#F15A24]/10' : 'bg-[#f05d24]/20'} blur-[30px] rounded-full opacity-25 animate-pulse`}></div>
          <ZoraLogo
            variant="icon"
            className={`h-20 w-20 block rounded-2xl border ${sessionUser ? 'border-[#E5DCD3]' : 'border-zinc-850'} bg-white p-1 relative z-10 animate-bounce shadow-2xl`}
          />
          <h1 className={`text-xl font-black tracking-widest ${sessionUser ? 'text-[#4E2817]' : 'text-[#f05d24]'} uppercase font-sans mt-4 animate-pulse`}>
            Zora Stays
          </h1>
          <p className={`text-[9px] tracking-[0.2em] ${sessionUser ? 'text-[#F15A24]' : 'text-[#f6aa8e]/85'} uppercase font-bold mt-1 font-mono`}>
            Smart Living for Her
          </p>
          <div className="mt-8 flex items-center gap-2 text-zinc-500 font-mono text-[10px]">
            <span className={`w-1.5 h-1.5 ${sessionUser ? 'bg-[#F15A24]' : 'bg-[#f05d24]'} rounded-full animate-ping`}></span>
            <span className={sessionUser ? 'text-[#4E2817]/70' : 'text-zinc-500'}>Securing encrypted handshake...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-500 ${
      sessionUser ? 'bg-[#FAF6F0] text-[#4E2817] selection:bg-[#F15A24]/20 selection:text-[#4E2817]' : 'bg-[#0E0B0A] text-white selection:bg-[#f6aa8e]/20 selection:text-[#f6aa8e]'
    }`}>
      
      {/* BRAND COLOR ACCENT TOP BAND */}
      <div className={`absolute top-0 inset-x-0 h-1 z-50 transition-colors duration-500 ${
        sessionUser ? 'bg-[#F15A24] shadow-md' : 'bg-gradient-to-r from-[#f05d24] via-[#f05d24] to-[#f6aa8e] shadow-[0_1px_10px_rgba(240,93,36,0.4)]'
      }`}></div>

      {/* HEADER SECTION */}
      {sessionUser && (
        <header className="sticky top-0 z-40 bg-white/95 border-b border-[#E5DCD3] backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ZoraLogo
                variant="icon"
                className="h-10 w-10 block rounded-xl border border-[#E5DCD3] bg-white p-0.5 shadow-sm"
              />
              <span className="text-sm font-black tracking-wider text-[#4E2817] uppercase font-sans">
                Zora Stays
              </span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#FAF6F0] text-[#F15A24] border border-[#E5DCD3] font-mono tracking-wider font-semibold">
              {dbService.isRealFirebase() ? "LIVE PG WORKSPACE" : "SANDBOX FALLBACK"}
            </span>
          </div>

          {/* Clock Widget + Profile Control */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Live WhatsApp Direct Helpdesk Action Link */}
            <a
              href="https://wa.me/919540960412?text=Hello%20Zora%20Stays%20Support%2C%20I%20have%20an%20inquiry%20regarding%20my%20residency..."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-350 px-3.5 py-1.5 rounded-xl flex items-center gap-2 font-mono text-[#4E2817] shadow-sm select-none cursor-pointer transition-all active:scale-[0.98]"
              title="Open Direct Chat with WhatsApp Business Account"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-emerald-700 font-extrabold uppercase tracking-wide">
                WhatsApp Support
              </span>
              <span className="hidden md:inline text-[10px] font-medium text-emerald-600 tracking-wider">
                9540960412
              </span>
            </a>

            <div className="bg-white border border-[#E5DCD3] px-3 py-1.5 rounded-xl flex items-center gap-2 font-mono text-[#4E2817] shadow-sm">
              <Clock className="w-4 h-4 text-[#F15A24]" />
              <span className="text-xs text-[#4E2817] tracking-wider font-semibold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[9px] bg-[#FAF6F0] px-1 text-slate-500 border border-[#E5DCD3] rounded">UTC</span>
            </div>

            <div className="flex items-center gap-3 border-l border-[#E5DCD3] pl-4">
              <div className="text-right">
                <span className="text-xs font-bold block text-[#4E2817] tracking-wide leading-tight">
                  {sessionUser.info.name}
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-[#FAF6F0] border border-[#E5DCD3] px-1.5 py-0.5 rounded font-bold mt-0.5 block">
                  {sessionUser.role} {sessionUser.info.roomNumber ? `• Rm ${sessionUser.info.roomNumber}` : ""}
                </span>
              </div>
              
              {/* Security & Sessions Monitor */}
              <button
                onClick={() => {
                  setIsSessionModalOpen(true);
                  playCyberBlip();
                }}
                className="p-2.5 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#E5DCD3] text-slate-600 hover:text-blue-600 transition-all cursor-pointer shadow-sm relative group"
                title="Active Sessions Auditor"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {activeSessions.filter(s => s.id !== currentSessionId && s.status === 'active').length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] text-white font-extrabold flex items-center justify-center">
                      {activeSessions.filter(s => s.id !== currentSessionId && s.status === 'active').length}
                    </span>
                  </span>
                )}
              </button>

              {/* Log Out */}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-white hover:bg-[#FAF6F0] border border-[#E5DCD3] text-[#4E2817] hover:text-[#F15A24] transition-all cursor-pointer shadow-sm"
                title="Disconnect Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* PRIMARY CONSOLE WINDOW */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative">
        <AnimatePresence mode="wait">
          
          {/* ==================================== */}
          {/* 1. AUTH / SIGN IN BACKDROP GATE */}
          {/* ==================================== */}
          {!sessionUser && (
            <motion.div
              key="landing-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full text-white selection:bg-[#f6aa8e]/30 select-none pb-12"
            >
              {/* LANDING PAGE HEADER WITH LOGO */}
              <div className="flex flex-col md:flex-row justify-between items-center pb-8 border-b border-zinc-800/80 mb-12 gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-[#f05d24] blur-[15px] rounded-full opacity-30 group-hover:opacity-50 transition-all pointer-events-none"></div>
                    <ZoraLogo
                      variant="icon"
                      className="h-16 w-16 md:h-20 md:w-20 block rounded-2xl border border-[#1d0d02] bg-[#1d0d02] p-1 relative z-10 transition-transform duration-300 group-hover:scale-105 shadow-xl"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-black tracking-widest text-[#f05d24] uppercase font-sans">
                      Zora Stays
                    </h1>
                    <p className="text-[9px] tracking-[0.2em] text-[#f6aa8e]/85 uppercase font-bold mt-0.5 font-mono">
                      Smart Living for Her
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-center">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-850 rounded-full text-[10px] font-mono tracking-widest text-[#f05d24] font-black uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f05d24] animate-pulse"></span>
                    Operational Core Online
                  </span>
                </div>
              </div>

              {/* TWO-COLUMN HERO GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                      {/* LEFT COLUMN: MARKETING AND TECH PRODUCT FEATURE GRID */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f05d24]/10 text-[#f05d24] border border-[#f05d24]/30 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest">
                      ✦ NEXT-GEN RESIDENT MANAGEMENT PROTOCOL
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-[#FFFFFF] uppercase tracking-tight font-sans leading-tight">
                      Smart Living &<br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f05d24] to-[#f6aa8e]">
                        Smart Solution
                      </span>
                    </h2>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-xl font-light">
                      Welcome to Zora, where premium hospitality intersects with intelligent, next-generation service layers. Track chores, log complaints, manage vacation clearings, and instant bank-level ledger matching—all synchronized in real-time.
                    </p>
                  </div>

                  {/* BENTO CAPABILITIES CONTAINER */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80 hover:border-[#f05d24]/40 transition-all group">
                      <Shield className="w-6 h-6 text-[#f05d24] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Cyber Gate Clearance</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wide leading-relaxed">
                        Secure instant QR or status authorization logs for leave and late entry.
                      </p>
                    </div>

                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80 hover:border-[#f05d24]/40 transition-all group">
                      <Briefcase className="w-6 h-6 text-[#f05d24] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Dynamic Core Dispatch</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wide leading-relaxed">
                        Ticket tracking with sub-system categories, escalation tiers, and direct sound alerts.
                      </p>
                    </div>

                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80 hover:border-[#f05d24]/40 transition-all group">
                      <CircleDollarSign className="w-6 h-6 text-[#f05d24] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Bank-grade Sync</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wide leading-relaxed">
                        Real-time tracking of active transactions and automated WhatsApp reminder logs.
                      </p>
                    </div>

                    <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80 hover:border-[#f05d24]/40 transition-all group">
                      <Users className="w-6 h-6 text-[#f05d24] mb-2 group-hover:scale-110 transition-transform" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Interactive Live Roster</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wide leading-relaxed">
                        Manage room distributions, genders, phone assets, and local passwords on safety desks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: RE-DESIGNED PREMIUM DENSE SIGN-IN SYSTEM CONTROLLER */}
                <div className="lg:col-span-12 xl:col-span-5 md:max-w-md md:mx-auto w-full">
                  <div className="bg-zinc-950 border border-[#f05d24]/20 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(240,93,36,0.06)] relative overflow-hidden transition-all hover:border-[#f05d24]/45 group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#f05d24]/5 to-transparent rounded-bl-3xl"></div>
                    
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#f05d24] font-mono mb-6 flex items-center gap-2" id="verified-gate-title">
                      <KeyRound className="w-4 h-4 text-[#f05d24]" />
                      Portal Identity Verification Gate
                    </h3>

                    {/* Compact Modern Form Role Switcher */}
                    <div className="flex rounded-xl bg-zinc-900/50 border border-zinc-850 p-1 mb-6 shadow-inner">
                      <button
                        type="button"
                        onClick={() => { setLoginRole('tenant'); setLoginError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          loginRole === 'tenant'
                            ? 'bg-[#f05d24] text-white shadow-lg shadow-[#f05d24]/20 font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Tenant Console
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLoginRole('employee'); setLoginError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          loginRole === 'employee'
                            ? 'bg-[#f05d24] text-white shadow-lg shadow-[#f05d24]/20 font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Employee Terminal
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLoginRole('manager'); setLoginError(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          loginRole === 'manager'
                            ? 'bg-[#f05d24] text-white shadow-lg shadow-[#f05d24]/20 font-extrabold'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        Director Gate
                      </button>
                    </div>

                    {/* Standard Password / Email Error Panel */}
                    {loginError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-4 flex gap-2 p-3.5 bg-red-950/40 border border-red-500/40 rounded-xl text-red-400 text-xs items-center font-medium shadow-md"
                      >
                        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
                        <p>{loginError}</p>
                      </motion.div>
                    )}

                    {/* Standard Credentials Input Fields */}
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-zinc-400 tracking-widest block font-mono">
                          {loginRole === 'manager' 
                            ? 'Director Access Token Email' 
                            : loginRole === 'employee' 
                              ? 'Staff Registered Email' 
                              : 'Assigned Resident Email'}
                        </label>
                        <input
                          type="text"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder={
                            loginRole === 'manager' 
                              ? "admin@zora.com" 
                              : loginRole === 'employee' 
                                ? "amit@zora.com" 
                                : "elena@zora.com"
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#f05d24] focus:ring-1 focus:ring-[#f05d24]/30 rounded-xl p-3 text-xs text-white placeholder:text-zinc-650 outline-none transition-all font-sans"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-black text-zinc-400 tracking-widest block font-mono">
                          Secure Key Password
                        </label>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#f05d24] focus:ring-1 focus:ring-[#f05d24]/30 rounded-xl p-3 text-xs text-white placeholder:text-zinc-650 outline-none transition-all font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-[#f05d24] to-[#f6aa8e] text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl hover:opacity-95 hover:scale-[1.01] transition-all shadow-md shadow-[#f05d24]/10 hover:shadow-[#f05d24]/30 mt-6 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-mono"
                        id="btn-login-submit"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white text-white" />
                        Verify Console Access
                      </button>
                    </form>

                    {/* HELP & SUPPORT SECTION */}
                    <div className="mt-6 pt-5 border-t border-zinc-900 flex flex-col gap-3">
                      <div className="pt-2 flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-[#f6aa8e] mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#f05d24] font-sans leading-none mb-2">
                            Having any trouble?
                          </h4>
                          <div className="text-[11px] text-zinc-400 leading-relaxed font-sans space-y-1.5">
                            <p className="font-semibold text-zinc-200">We're here to help!</p>
                            <p>Whether you're facing a technical glitch or just have a question, our support team is available 24/7 to sort it out for you. 🙌</p>
                            <p className="font-semibold text-[#f6aa8e] mt-1">📲 Drop us a message at: <span className="text-[#f6aa8e] font-mono text-xs font-bold font-semibold">+91 95409 60412</span></p>
                            <p className="text-[10px] text-zinc-500 italic mt-0.5">(We are just a text away!) 😊</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ==================================== */}
          {/* 2. TENANT VIEW LAYOUT (SINGLE-SCREEN) */}
          {/* ==================================== */}
          {sessionUser && sessionUser.role === 'tenant' && (
            <motion.div
              key="tenant-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-6 my-4"
            >
                {/* PROMINENT RESIDENT ONBOARDING DECAL */}
                {!sessionUser.info.onboarded && (
                  <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
                    className="bg-linear-to-r from-[#170B06] via-[#0D0B1F]/60 to-[#070817] border-2 border-orange-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(241,90,36,0.12)] flex flex-col md:flex-row justify-between items-center gap-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400 animate-pulse">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase font-mono">
                            Zora Resident Core Protocol Setup
                          </span>
                          <span className="px-1.5 py-0.5 text-[8px] bg-red-950/60 border border-red-500/25 text-red-400 font-extrabold rounded font-mono animate-pulse">
                            PROFILE INCOMPLETE
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white mt-1.5 tracking-wide">
                          Unlock Fast-Track Pass Clearance & Ticketing Actions
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-light max-w-xl">
                          Your profile is missing crucial metadata! Launch the 3-step resident onboarding guide to verify room setup, personalize your gateway avatar, and review critical support systems.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setIsOnboardingModalOpen(true); playCyberBlip(); }}
                      className="w-full md:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-sans text-xs font-black rounded-xl transition-all shadow-lg shadow-orange-950/40 hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer neon-glow-orange shrink-0 select-none"
                    >
                      Complete Onboarding
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* DIGITAL NOTICE BOARD - PINNED TO THE TOP WITH SLIDE-DOWN ANIMATION */}
                {notices.length > 0 && (
                  <motion.div 
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className="bg-[#0A0D26]/80 border-2 border-amber-500/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(245,158,11,0.15)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 animate-pulse"></div>
                    <div className="flex flex-col md:flex-row items-stretch gap-6">
                      <div className="flex-1 flex items-start gap-4">
                        <div className="p-3 bg-amber-500/15 rounded-2xl border border-amber-500/35 text-amber-400 flex-shrink-0 animate-pulse">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest font-mono">
                              Broadcast Alert • Digital Notice Board
                            </span>
                            {notices[0]?.urgency === 'critical' ? (
                              <span className="px-2 py-0.5 text-[9px] bg-red-950/60 text-red-400 font-extrabold uppercase rounded border border-red-500/30 font-mono animate-pulse">
                                CRITICAL
                              </span>
                            ) : notices[0]?.urgency === 'important' ? (
                              <span className="px-2 py-0.5 text-[9px] bg-amber-950/60 text-amber-400 font-extrabold uppercase rounded border border-amber-500/30 font-mono">
                                IMPORTANT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] bg-blue-950/60 text-blue-400 font-extrabold uppercase rounded border border-blue-500/30 font-mono">
                                INFO
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-white mt-1.5 tracking-wide">{notices[0]?.title}</h4>
                          <p className="text-xs text-slate-300 mt-1 pb-1 leading-relaxed font-light">{notices[0]?.content}</p>
                          <span className="text-[9px] text-slate-500 font-mono block mt-2 pt-1 border-t border-slate-900/60">
                            Broadcast timestamp: {new Date(notices[0]?.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {notices.length > 1 && (
                        <div className="md:w-80 pl-0 md:pl-6 border-t md:border-t-0 md:border-l border-slate-850/60 flex flex-col pt-4 md:pt-0">
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 font-mono mb-2">
                            <Bell className="w-3.5 h-3.5 text-blue-400" />
                            Archived Announcements
                          </span>
                          <div className="space-y-2.5 max-h-24 overflow-y-auto pr-1 flex-1">
                            {notices.slice(1).map(notice => (
                              <div key={notice.id} className="text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/60">
                                <span className="font-extrabold text-amber-400 text-[10px] block truncate">{notice.title}</span>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-light">{notice.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* MAIN GRID - LEFT SIDEBAR (PROFILE/BILLING) • RIGHT SIDEBAR (GATEPASS/MESS/INCIDENTS) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column Section */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Residency profile Card */}
                    <motion.div 
                      className="bg-[#0A0B1A] border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden profile-card-glow"
                      whileHover={{ 
                        scale: 1.03,
                        rotateX: -2, 
                        rotateY: 4,
                      }}
                      transition={{ 
                        type: "tween",
                        ease: "easeOut",
                        duration: 0.3
                      }}
                      style={{ 
                        transformStyle: 'preserve-3d', 
                        perspective: '1000px',
                        willChange: 'transform'
                      }}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex flex-col items-center text-center">
                        <img 
                          src={sessionUser.info.photoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"} 
                          alt="avatar" 
                          referrerPolicy="no-referrer"
                          className="w-18 h-18 rounded-full object-cover border-2 border-slate-800 neon-glow-blue p-0.5 mb-3"
                        />
                        
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-extrabold text-white tracking-wide font-sans">{sessionUser.info.name}</h2>
                          <button
                            onClick={() => {
                              setEditingTenant(sessionUser.info);
                              setIsEditTenantModalOpen(true);
                              playCyberBlip && playCyberBlip();
                            }}
                            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded transition-all cursor-pointer"
                            title="Edit My Profile Details"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="text-[10px] bg-blue-950 border border-blue-900/50 text-blue-400 font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 mt-1 rounded-full">
                            Room assignment: {sessionUser.info.roomNumber}
                          </span>
                          
                          {/* Live Resident Location Badge */}
                          <div className="mx-auto mt-1 flex flex-col items-center gap-1.5">
                            {sessionUser.info.statusBadge === 'leave' ? (
                              <span className="px-2.5 py-0.5 text-[9px] bg-yellow-950/60 text-yellow-400 font-extrabold rounded-full border border-yellow-500/20 uppercase tracking-widest font-mono">
                                ✈ On Leave
                              </span>
                            ) : sessionUser.info.statusBadge === 'late' ? (
                              <span className="px-2.5 py-0.5 text-[9px] bg-red-950/60 text-red-400 font-extrabold rounded-full border border-red-500/20 uppercase tracking-widest font-mono animate-pulse">
                                ⏰ Late Entry Approved
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 text-[9px] bg-emerald-950/60 text-emerald-400 font-extrabold rounded-full border border-emerald-500/20 uppercase tracking-widest font-mono">
                                🏠 In Hostel
                              </span>
                            )}

                            {/* Onboarding Wizard Checklist Status Badge */}
                            {!sessionUser.info.onboarded ? (
                              <button
                                onClick={() => { setIsOnboardingModalOpen(true); playCyberBlip(); }}
                                className="px-2.5 py-0.5 text-[9px] bg-orange-950/40 border border-orange-500/30 text-orange-400 font-black rounded-full uppercase tracking-widest font-mono animate-pulse hover:bg-orange-900/40 hover:text-white hover:scale-105 transition-all cursor-pointer shadow-sm shadow-orange-950/25 select-none"
                                title="Click to launch profile wizard!"
                              >
                                ⚡ Setup Profile Wizard
                              </button>
                            ) : (
                              <span className="px-2.5 py-0.5 text-[9px] bg-emerald-950/20 border border-emerald-500/15 text-emerald-400 font-black rounded-full uppercase tracking-widest font-mono flex items-center gap-1 select-none">
                                <Award className="w-2.5 h-2.5" />
                                Protocol Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <hr className="border-slate-850/60 my-5" />

                      {/* Profile data list */}
                      <div className="space-y-4 text-xs">
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-400 font-medium">Sharing Type</span>
                          <span className="text-white font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-900" id="sharing-type-val">
                            {sessionUser.info.sharingType} Sharing
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-400 font-medium">Residing Since</span>
                          <span className="text-slate-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-900">
                            {sessionUser.info.residingSince}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-400 font-medium">Contact Phone</span>
                          <span className="text-slate-350">{sessionUser.info.phoneNumber}</span>
                        </div>

                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-400 font-medium">Registered Mail</span>
                          <span className="text-blue-400 font-mono font-light select-all">{sessionUser.info.mailId}</span>
                        </div>

                        {sessionUser.info.emergencyContact && (
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-400 font-medium">Emergency Contact</span>
                            <span className="text-amber-400 text-right text-[11px] truncate max-w-[150px]" title={sessionUser.info.emergencyContact}>
                              {sessionUser.info.emergencyContact}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-400 font-medium">Security Deposit</span>
                          <span className="text-slate-300 font-mono text-right text-[11px]">
                            ${sessionUser.info.securityDepositAmount !== undefined ? sessionUser.info.securityDepositAmount : 15000} ({sessionUser.info.securityDepositStatus === 'paid' ? '🟢 Paid' : sessionUser.info.securityDepositStatus === 'refunded' ? '⚪ Refunded' : '🟡 Pending'})
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-slate-400 font-medium">Verified ID Proof</span>
                          <span className="text-slate-300 text-right text-[11px]">
                            {sessionUser.info.idProofType || 'Passport'} ({sessionUser.info.idProofStatus === 'verified' ? '🛡️ Verified' : '⌛ Pending'})
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-850/60 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Permanent Residence Address</span>
                          <p className="text-slate-350 pr-4 leading-normal bg-slate-950/40 p-2 border border-slate-900 rounded-lg">
                            {sessionUser.info.address}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* SMART BILLING & RENT COLLECTION WIDGET */}
                    <div className="bg-[#0A0B1A] border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-850/60">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 font-mono flex items-center gap-1.5">
                          <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                          Billing & Dues Portal
                        </h3>
                        {sessionUser.info.paymentStatus === 'paid' ? (
                          <span className="px-2.5 py-0.5 text-[9px] bg-emerald-950/60 text-emerald-400 font-extrabold rounded-full border border-emerald-500/30 uppercase tracking-widest font-mono">
                            Settled
                          </span>
                        ) : sessionUser.info.paymentStatus === 'overdue' ? (
                          <span className="px-2.5 py-0.5 text-[9px] bg-red-950/60 border border-red-500/30 text-red-200 font-extrabold rounded-full uppercase tracking-widest animate-pulse font-mono">
                            Overdue
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[9px] bg-amber-950/60 text-amber-400 font-extrabold rounded-full border border-amber-500/30 uppercase tracking-widest font-mono">
                            Pending
                          </span>
                        )}
                      </div>

                      {notifications.some((n) => n.recipientId === sessionUser.info.tenantId && !n.read && n.title.includes('RENT REMINDER')) && (
                        <motion.div
                          animate={{ boxShadow: ["0 0 4px rgba(239, 68, 68, 0.4)", "0 0 12px rgba(239, 68, 68, 0.8)", "0 0 4px rgba(239, 68, 68, 0.4)"] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="mb-4 p-3 bg-red-950/30 border border-red-550/45 rounded-xl text-red-200 text-xs flex flex-col gap-1 shadow-lg"
                        >
                          <div className="flex items-center gap-1.5 font-extrabold text-red-400 font-mono text-[10px] uppercase">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            EMERGENCY BALANCE NOTICE
                          </div>
                          <p className="text-[10px] text-slate-350 leading-normal font-light">
                            Management has issued an overdue billing message. Rent of ₹{(sessionUser.info.rentAmount || 11000).toLocaleString('en-IN')} was due on {sessionUser.info.dueDate || '2026-06-05'}. Please clear below.
                          </p>
                        </motion.div>
                      )}

                      <div className="space-y-4">
                        <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900/80 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider font-mono">Upcoming Rent Dues</span>
                            <span className="text-xl font-black text-white font-mono mt-0.5 block">
                              ₹{(sessionUser.info.rentAmount || 11000).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider font-sans">Payment Due</span>
                            <span className="text-xs font-extrabold text-slate-200 block font-mono mt-0.5">
                              {sessionUser.info.dueDate || '2026-06-05'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            const updated = { ...sessionUser.info, paymentStatus: 'paid' as const };
                            await dbService.saveTenant(updated);

                            // Real-time sync: Create or update corresponding RentPayment receipt
                            const paymentId = `RENT-${sessionUser.info.tenantId}-2026-06`;
                            const rentPay: RentPayment = {
                              id: paymentId,
                              tenantId: sessionUser.info.tenantId,
                              tenantName: sessionUser.info.name,
                              roomNumber: sessionUser.info.roomNumber,
                              amount: sessionUser.info.rentAmount || 11000,
                              month: "June 2026",
                              status: 'paid',
                              paidAt: new Date().toISOString()
                            };
                            await dbService.saveRentPayment(rentPay);

                            playSuccessTone();
                            // Update our local session as well so status badge re-renders instantly
                            setSessionUser({ role: 'tenant', info: updated });
                            addToast("Payment Logged", "Dynamic ledger entry synchronized. Rent balance cleared!", "success");
                          }}
                          disabled={sessionUser.info.paymentStatus === 'paid'}
                          className={`w-full py-3 rounded-xl text-center text-xs font-extrabold uppercase tracking-widest border transition-all ${
                            sessionUser.info.paymentStatus === 'paid'
                              ? 'bg-slate-900 border-slate-850 text-slate-600 cursor-not-allowed cursor-default'
                              : 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 cursor-pointer shadow-md shadow-emerald-950/10'
                          }`}
                        >
                          {sessionUser.info.paymentStatus === 'paid' ? 'Invoice Settled ✓' : 'Pay Rent Balance'}
                        </button>
                      </div>
                    </div>

                    {/* Support Command Center CTA */}
                    <div className="bg-gradient-to-br from-[#0F102D] to-[#080816] border border-slate-850 rounded-2xl p-6 relative shadow-xl overflow-hidden shadow-blue-900/5">
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/5 blur-2xl pointer-events-none"></div>
                      
                      <h3 className="text-sm font-bold text-white tracking-widest uppercase font-sans mb-1 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-blue-400 animate-spin" />
                        How can we assist you?
                      </h3>
                      <p className="text-xs text-slate-400 leading-normal pr-4 mb-4 font-light">
                        Experienced catering issues, clogging, warm AC, or billing discrepancies? Submit your incident instantly to our on-site team.
                      </p>

                      <div className="relative w-full">
                        <AnimatePresence>
                          {showComplaintTooltip && (
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-slate-900/95 backdrop-blur-md text-slate-200 text-[11px] rounded-lg shadow-2xl border border-slate-800 whitespace-nowrap text-center pointer-events-none font-sans flex items-center gap-1.5 text-glow-blue"
                            >
                              <Clock className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                              <span>Typical response time: <strong className="text-white">2 hours</strong></span>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <motion.button
                          onClick={() => setIsRaiseModalOpen(true)}
                          onMouseEnter={() => setShowComplaintTooltip(true)}
                          onMouseLeave={() => setShowComplaintTooltip(false)}
                          onFocus={() => setShowComplaintTooltip(true)}
                          onBlur={() => setShowComplaintTooltip(false)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-900/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2 font-mono"
                          id="btn-trigger-raise-wizard"
                          animate={{
                            scale: [1, 1.02, 1],
                            boxShadow: [
                              "0px 4px 12px rgba(37, 99, 235, 0.15)",
                              "0px 4px 20px rgba(37, 99, 235, 0.45)",
                              "0px 4px 12px rgba(37, 99, 235, 0.15)"
                            ]
                          }}
                          whileHover={{
                            scale: 1.05,
                            y: -4,
                            boxShadow: "0px 10px 25px rgba(37, 99, 235, 0.35)"
                          }}
                          whileFocus={{
                            scale: 1.05,
                            y: -4,
                            boxShadow: "0px 10px 25px rgba(37, 99, 235, 0.35)"
                          }}
                          whileTap={{
                            scale: 0.98,
                            y: 0
                          }}
                          transition={{
                            scale: { repeat: Infinity, duration: 3, ease: "easeInOut", type: "tween" },
                            boxShadow: { repeat: Infinity, duration: 3, ease: "easeInOut", type: "tween" },
                            default: {
                              type: "spring",
                              stiffness: 400,
                              damping: 15,
                              mass: 0.8
                            }
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Raise Complaint Ticket
                        </motion.button>
                      </div>

                      <a
                        href="https://wa.me/919540960412?text=Hello%20Zora%20Stays%20Support%20Team%2C%20I%20am%20a%20resident%20of%20Zora%20Stays%20and%20need%20to%20chat%20about%20my%20residency..."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/15 active:scale-95 cursor-pointer flex items-center justify-center gap-2 font-mono"
                        id="btn-trigger-whatsapp-direct"
                        title="Chat Direct via WhatsApp Business Account"
                      >
                        <PhoneCall className="w-4 h-4" />
                        Chat WhatsApp Desk
                      </a>
                    </div>

                  </div>

                  {/* Right Column Section */}
                  <div className="lg:col-span-2 space-y-6">
                    

                    {/* WEEKLY MESS/MEAL MENU VOTING CARD */}
                    <div className="bg-[#0A0B1A] border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex justify-between items-center pb-3 border-b border-slate-850/60 mb-4 flex-wrap gap-2">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#FED766] font-mono flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-amber-400" />
                          Zora Mess Menu & ratings
                        </h3>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase px-2.5 py-0.5 rounded font-mono">
                          Active Day: {tenantSelectedDay}
                        </span>
                      </div>

                      {/* Day selector tabs for tenants */}
                      <div className="flex bg-slate-950 p-1 rounded-xl mb-4 overflow-x-auto gap-1 border border-slate-900">
                        {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day) => {
                          const isSelected = tenantSelectedDay === day;
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setTenantSelectedDay(day)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-all flex-1 text-center min-w-[50px] ${
                                isSelected
                                  ? 'bg-amber-600/15 border border-amber-500/30 text-amber-400 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      {(() => {
                        const currentMealFeedback = meals.find(m => m.day === tenantSelectedDay) || {
                          day: tenantSelectedDay,
                          breakfastVotes: { up: 12, down: 1 },
                          lunchVotes: { up: 18, down: 0 },
                          dinnerVotes: { up: 22, down: 1 },
                          breakfastMenu: "Aloo Paratha & Fresh Curd",
                          breakfastSub: "Pickle, Butter, Fresh Tea",
                          lunchMenu: "Chole Rice & Hot Roti",
                          lunchSub: "Spiced Boondi Raita, Salad",
                          dinnerMenu: "Shahi Paneer & Naan",
                          dinnerSub: "Day's Special Dish 🌟"
                        };

                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                              {/* Breakfast */}
                              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900/80 flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-amber-500 font-mono tracking-wider">Breakfast (7:30AM)</span>
                                  <span className="text-xs font-extrabold text-white block mt-1">
                                    {currentMealFeedback.breakfastMenu || "Aloo Paratha & Fresh Curd"}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">
                                    {currentMealFeedback.breakfastSub || "Pickle, Butter, Fresh Tea"}
                                  </span>
                                </div>
                                <div className="flex gap-1.5 mt-3 border-t border-slate-900/60 pt-2.5 items-center justify-between">
                                  <span className="text-[9px] font-mono text-slate-500">Feedback:</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleVoteMeal(tenantSelectedDay, 'breakfast', 'up')}
                                      className="px-2 py-1 bg-emerald-955/30 text-emerald-400 hover:bg-emerald-950 border border-emerald-500/20 text-[9px] font-mono rounded flex items-center gap-1 cursor-pointer"
                                    >
                                      👍 {currentMealFeedback.breakfastVotes.up}
                                    </button>
                                    <button
                                      onClick={() => handleVoteMeal(tenantSelectedDay, 'breakfast', 'down')}
                                      className="px-2 py-1 bg-red-955/35 text-red-500 hover:bg-red-950 border border-red-500/20 text-[9px] font-mono rounded flex items-center gap-1 cursor-pointer"
                                    >
                                      👎 {currentMealFeedback.breakfastVotes.down}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Lunch */}
                              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900/80 flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-amber-500 font-mono tracking-wider">Lunch (1:30PM)</span>
                                  <span className="text-xs font-extrabold text-white block mt-1">
                                    {currentMealFeedback.lunchMenu || "Chole Rice & Hot Roti"}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">
                                    {currentMealFeedback.lunchSub || "Spiced Boondi Raita, Salad"}
                                  </span>
                                </div>
                                <div className="flex gap-1.5 mt-3 border-t border-slate-900/60 pt-2.5 items-center justify-between">
                                  <span className="text-[9px] font-mono text-slate-500">Feedback:</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleVoteMeal(tenantSelectedDay, 'lunch', 'up')}
                                      className="px-2 py-1 bg-emerald-955/30 text-emerald-400 hover:bg-emerald-950 border border-emerald-500/20 text-[9px] font-mono rounded flex items-center gap-1 cursor-pointer"
                                    >
                                      👍 {currentMealFeedback.lunchVotes.up}
                                    </button>
                                    <button
                                      onClick={() => handleVoteMeal(tenantSelectedDay, 'lunch', 'down')}
                                      className="px-2 py-1 bg-red-955/35 text-red-550 hover:bg-red-950 border border-red-500/20 text-[9px] font-mono rounded flex items-center gap-1 cursor-pointer"
                                    >
                                      👎 {currentMealFeedback.lunchVotes.down}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Dinner */}
                              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900/80 flex flex-col justify-between">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-amber-500 font-mono tracking-wider">Dinner (8:00PM)</span>
                                  <span className="text-xs font-extrabold text-white block mt-1">
                                    {currentMealFeedback.dinnerMenu || "Shahi Paneer & Naan"}
                                  </span>
                                  <span className="text-[9px] text-slate-500 block mt-0.5 font-sans">
                                    {currentMealFeedback.dinnerSub || "Day's Special Dish 🌟"}
                                  </span>
                                </div>
                                <div className="flex gap-1.5 mt-3 border-t border-slate-900/60 pt-2.5 items-center justify-between">
                                  <span className="text-[9px] font-mono text-slate-500">Feedback:</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleVoteMeal(tenantSelectedDay, 'dinner', 'up')}
                                      className="px-2 py-1 bg-emerald-955/30 text-emerald-400 hover:bg-emerald-950 border border-emerald-500/20 text-[9px] font-mono rounded flex items-center gap-1 cursor-pointer"
                                    >
                                      👍 {currentMealFeedback.dinnerVotes.up}
                                    </button>
                                    <button
                                      onClick={() => handleVoteMeal(tenantSelectedDay, 'dinner', 'down')}
                                      className="px-2 py-1 bg-red-955/35 text-red-550 hover:bg-red-950 border border-red-500/20 text-[9px] font-mono rounded flex items-center gap-1 cursor-pointer"
                                    >
                                      👎 {currentMealFeedback.dinnerVotes.down}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Highlight special message */}
                            <div className="bg-gradient-to-r from-slate-950 to-amber-950/15 border border-amber-950/30 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                              <div className="text-center sm:text-left flex-1">
                                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block font-mono">🌟 Day's special Highlights</span>
                                <h4 className="text-xs font-extrabold text-white mt-1">Dinner Special: {currentMealFeedback.dinnerMenu || "Shahi Paneer & Naan"}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-light">Rate today's Special. Manager counts feedback values in analytics graphs.</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Tenant Incident Tickets Grid Timeline */}
                    <div className="bg-[#0A0B1A] border border-slate-850 rounded-2xl p-6 shadow-xl min-h-[35vh]">
                      
                      <div className="flex justify-between items-center pb-4 border-b border-slate-850/60 mb-5">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-white font-mono flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 neon-glow-blue animate-pulse"></span>
                          Your Incident Timeline Log ({tickets.filter(t => t.tenantId === sessionUser.info.tenantId).length})
                        </h3>
                      </div>

                      {/* Own Ticket Expandable List */}
                      <div className="space-y-4">
                        {tickets.filter(t => t.tenantId === sessionUser.info.tenantId).length === 0 ? (
                          <div className="py-12 text-center border border-dashed border-slate-850 rounded-2xl">
                            <Wrench className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                            <h4 className="text-xs font-bold text-slate-650 uppercase tracking-widest font-mono">No Active Complaints Resolved</h4>
                            <p className="text-[10px] text-slate-550 mt-1 uppercase max-w-sm mx-auto leading-relaxed">
                              Your residency records are complete. Use 'Raise Complaint Ticket' to file any pg issues.
                            </p>
                          </div>
                        ) : (
                          [...tickets]
                            .filter(t => t.tenantId === sessionUser.info.tenantId)
                            .reverse()
                            .map((ticket) => {
                              return (
                                <div 
                                  key={ticket.id}
                                  className="bg-[#0E0F26] border border-slate-850/80 hover:border-slate-800 rounded-xl p-4 transition-all relative overflow-hidden"
                                >
                                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 border border-slate-900 rounded font-bold">
                                          {ticket.id}
                                        </span>
                                        <h4 className="text-xs font-bold text-white tracking-wide font-sans">{ticket.title}</h4>
                                      </div>
                                      <div className="flex gap-2 items-center text-[10px] text-slate-400 mt-1 font-mono uppercase">
                                        <span>Category: <span className="text-slate-300 font-semibold">{ticket.category}</span></span>
                                        <span>•</span>
                                        <span>Priority: 
                                          <span className={`ml-1 font-bold ${
                                            ticket.priority === 'urgent' ? 'text-orange-400' :
                                            ticket.priority === 'high' ? 'text-amber-400' : 'text-blue-400'
                                          }`}>
                                            {ticket.priority}
                                          </span>
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                                        ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        ticket.status === 'in-progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                                        'bg-slate-500/10 text-slate-400 border border-slate-600/30'
                                      }`}>
                                        {ticket.status}
                                      </span>

                                      {/* View / Open Actions */}
                                      <button
                                        onClick={() => setSelectedTicket(ticket)}
                                        className="px-3 py-1 bg-blue-900/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:text-white rounded-lg text-[9px] font-bold font-sans uppercase tracking-wider cursor-pointer transition-all"
                                      >
                                        Inspect ({ticket.comments.length})
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-xs text-slate-350 line-clamp-2 leading-relaxed bg-[#0A0A1F]/40 p-3 text-glow-blue rounded-lg border border-slate-900 font- sans pl-3 border-l-2 border-l-blue-500/30 font-light font-sans pl-3 border-l-2 border-l-blue-500/30 font-light">
                                    {ticket.description}
                                  </p>

                                  <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                    <span>Pushed: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    <div className="flex gap-3">
                                      <span className="text-slate-400">Escalated: <strong className="text-slate-250 font-bold">{ticket.followupCount}</strong></span>
                                    </div>
                                  </div>

                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    {/* DIGITAL GATE PASS & TRAVEL PERMITS SECTION */}
                    <div className="bg-[#0A0B1A] border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                      
                      <div className="flex justify-between items-center pb-3 border-b border-slate-850/60 mb-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#4E88FF] font-mono flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-blue-400" />
                          Digital Gate Pass & Travel Permits
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* New Gate Pass Form */}
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const type = (form.elements.namedItem('passType') as HTMLSelectElement).value as 'leave' | 'late-entry' | 'visitor';
                            
                            let depDate = "";
                            let retDate = "";
                            let reason = "";
                            let vName = "";
                            let vRelation = "";
                            let vDate = "";
                            let vTime = "";

                            if (type === 'visitor') {
                              vName = (form.elements.namedItem('visitorName') as HTMLInputElement).value;
                              vRelation = (form.elements.namedItem('visitorRelation') as HTMLInputElement).value;
                              vDate = (form.elements.namedItem('visitDate') as HTMLInputElement).value;
                              vTime = (form.elements.namedItem('visitTime') as HTMLInputElement).value;
                              reason = `Guest Visit: ${vName} (${vRelation})`;

                              if (!vName || !vRelation || !vDate || !vTime) {
                                addToast("Missing Visitor Details", "All guest details are required to pre-approve visitor passes.", "warning");
                                return;
                              }
                              depDate = vDate;
                              retDate = vTime;
                            } else {
                              depDate = (form.elements.namedItem('depDate') as HTMLInputElement).value;
                              retDate = (form.elements.namedItem('retDate') as HTMLInputElement).value;
                              reason = (form.elements.namedItem('reason') as HTMLTextAreaElement).value;

                              if (!depDate || !retDate || !reason) {
                                addToast("Missing Travel Timelines", "Fields are required to construct security pass codes.", "warning");
                                return;
                              }
                            }
                            handleSubmitGatePass(type, depDate, retDate, reason, vName, vRelation, vDate, vTime);
                            form.reset();
                          }}
                          className="space-y-3"
                        >
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono block">Apply for Digital Pass</span>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider">Permit Type</label>
                              <select 
                                name="passType"
                                value={activePassType}
                                onChange={(e) => setActivePassType(e.target.value as any)}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-blue-550 rounded-lg px-2.5 py-2 text-xs text-slate-300 outline-none mt-1 font-sans cursor-pointer"
                              >
                                <option value="leave">Vacation Leave</option>
                                <option value="late-entry">Late Entry (&gt;9:00 PM)</option>
                                <option value="visitor">Visitor Guest Pass</option>
                              </select>
                            </div>

                            {activePassType === 'visitor' ? (
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider">Guest Full Name</label>
                                <input 
                                  name="visitorName"
                                  type="text"
                                  placeholder="e.g. John Doe"
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-550 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none mt-1 font-medium font-sans"
                                />
                              </div>
                            ) : (
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider">Departure Date</label>
                                <input 
                                  name="depDate"
                                  type="date"
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-550 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none font-mono mt-1"
                                />
                              </div>
                            )}
                          </div>

                          {activePassType === 'visitor' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider">Relation / Role</label>
                                <select 
                                  name="visitorRelation"
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-550 rounded-lg px-2.5 py-2 text-xs text-slate-300 outline-none mt-1 font-sans cursor-pointer"
                                >
                                  <option value="Parent">Parent</option>
                                  <option value="Sibling">Sibling</option>
                                  <option value="Relative">Relative</option>
                                  <option value="Friend">Friend</option>
                                  <option value="Official Delivery">Official Delivery / Helper</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider font-semibold">Visit Date</label>
                                <input 
                                  name="visitDate"
                                  type="date"
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-550 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none font-mono mt-1"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider font-medium">Return Date</label>
                                <input 
                                  name="retDate"
                                  type="date"
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-550 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none font-mono mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider block font-sans">Submit Permit</label>
                                <button
                                  type="submit"
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer block mt-1 text-center font-mono shadow-md shadow-blue-955/10 hover:scale-[1.01]"
                                >
                                  Request Permit
                                </button>
                              </div>
                            </div>
                          )}

                          {activePassType === 'visitor' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider font-medium">Expected Arrival Time</label>
                                <input 
                                  name="visitTime"
                                  type="time"
                                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-550 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none font-mono mt-1"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider block font-sans">Submit Gate Pass</label>
                                <button
                                  type="submit"
                                  className="w-full py-2 bg-purple-600 hover:bg-purple-550 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer block mt-1 text-center font-mono shadow-md shadow-purple-955/10 hover:scale-[1.01]"
                                >
                                  Request Pass ✓
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="text-[9px] uppercase font-extrabold text-slate-500 font-mono tracking-wider block mb-1">Reason for request</label>
                              <textarea
                                name="reason"
                                placeholder="e.g., family vacation visit, office work overtimes, university academic exams..."
                                rows={2}
                                className="w-full bg-slate-950 border border-slate-850 focus:border-blue-555 shadow-inner rounded-xl p-3 text-xs text-slate-300 outline-none resize-none font-sans"
                              />
                            </div>
                          )}
                        </form>

                        {/* Travel Pass Status List */}
                        <div className="space-y-3 flex flex-col">
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono block">Pass Log Status Ledger</span>
                          <div className="space-y-2.5 max-h-[195px] overflow-y-auto pr-1 flex-1">
                            {gatePasses.filter(gp => gp.tenantId === sessionUser.info.tenantId).length === 0 ? (
                              <div className="py-12 border border-dashed border-slate-850 rounded-2xl text-center text-slate-600 text-xs font-mono">
                                No travel passes logged yet.
                              </div>
                            ) : (
                              [...gatePasses]
                                .filter(gp => gp.tenantId === sessionUser.info.tenantId)
                                .reverse()
                                .map((pass) => (
                                  <div key={pass.id} className="bg-slate-950 p-3 border border-slate-900 rounded-xl flex gap-3 justify-between items-center">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-black tracking-wider ${
                                          pass.type === 'visitor' 
                                            ? 'bg-purple-950/40 border border-purple-500/20 text-purple-400' 
                                            : 'bg-blue-950/40 border border-blue-500/20 text-blue-400'
                                        }`}>
                                          {pass.type === 'visitor' ? 'Visitor Guest' : pass.type.replace('-', ' ')}
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded">{pass.id}</span>
                                      </div>
                                      {pass.type === 'visitor' ? (
                                        <div className="mt-1">
                                          <p className="text-white font-bold text-xs">{pass.visitorName} <span className="text-slate-400 font-normal">({pass.visitorRelation})</span></p>
                                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Visit: {pass.visitDate} @ {pass.visitTime}</p>
                                        </div>
                                      ) : (
                                        <div className="mt-1">
                                          <p className="text-[10px] text-slate-400 font-mono">{pass.departureDate} to {pass.returnDate}</p>
                                          <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[170px]" title={pass.reason}>"{pass.reason}"</p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-right shrink-0">
                                      {pass.status === 'approved' ? (
                                        <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono">
                                          Approved ✓
                                        </span>
                                      ) : pass.status === 'rejected' ? (
                                        <span className="px-2.5 py-0.5 bg-red-950/60 border border-red-500/20 text-red-400 rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono">
                                          Rejected
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 bg-amber-955/60 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono animate-pulse">
                                          In Review
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LOST & FOUND FORUM & COMMUNITY SECTION */}
                    <LostFoundSection
                      items={lostFoundItems}
                      onToggleStatus={handleToggleLostFoundStatus}
                      onDelete={(id) => handleDeleteLostFoundItem(id)}
                      onOpenPostModal={() => setIsLostFoundModalOpen(true)}
                      currentUserId={sessionUser.info.tenantId}
                      userRole="tenant"
                    />

                  </div>
                </div>

                {/* GOOGLE WORKSPACE UTILITIES SYSTEM */}
                <WorkspaceCenter userRole="tenant" userEmail={sessionUser.info.mailId} />

              </motion.div>
          )}

          {/* ==================================== */}
          {/* 3. MANAGER VIEW COMMAND HUB */}
          {/* ==================================== */}
          {sessionUser && sessionUser.role === 'manager' && (
            <motion.div
              key="manager-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 my-4"
            >
              
              {/* Stat Counters Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-[#0A0B1A] border border-slate-850 rounded-xl p-4 shadow-md relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Complaints</span>
                  <div className="text-2xl font-black mt-1 text-white font-mono text-glow-blue">
                    {tickets.length}
                  </div>
                </div>

                <div className="bg-[#0A0B1A] border border-slate-850 rounded-xl p-4 shadow-md relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-glow-orange">Pending Action</span>
                  <div className="text-2xl font-black mt-1 text-white font-mono">
                    {tickets.filter(t => t.status === 'pending').length}
                  </div>
                </div>

                <div className="bg-[#0A0B1A] border border-slate-850 rounded-xl p-4 shadow-md relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-glow-amber">In Progress</span>
                  <div className="text-2xl font-black mt-1 text-white font-mono">
                    {tickets.filter(t => t.status === 'in-progress').length}
                  </div>
                </div>

                <div className="bg-[#0A0B1A] border border-slate-850 rounded-xl p-4 shadow-md relative overflow-hidden">
                  <div className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-glow-emerald">Tickets Resolved</span>
                  <div className="text-2xl font-black mt-1 text-white font-mono">
                    {tickets.filter(t => t.status === 'resolved').length}
                  </div>
                </div>

              </div>

              {/* SYSTEM EXPORT OPERATIONS (DATA CENTER) */}
              <div className="bg-[#050612]/95 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
                <div className="space-y-1 z-10">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#f05d24] font-mono flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#f05d24]" />
                    Centralized Data Export Hub
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Pull instantaneous live snapshot archives of database state including registered resident rosters, active rooms, and complete rent ledger payments into standard compliant CSV files.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 z-10 w-full lg:w-auto">
                  <button
                    onClick={() => { playCyberBlip(); exportTenantsToCSV(); }}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white hover:border-slate-700 border border-slate-800 text-slate-300 text-[10px] font-black uppercase font-mono tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                    title="Generate and download comma-separated file for all registered tenant details"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Roster CSV</span>
                  </button>
                  <button
                    onClick={() => { playCyberBlip(); exportRoomsToCSV(); }}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white hover:border-slate-700 border border-slate-800 text-slate-300 text-[10px] font-black uppercase font-mono tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                    title="Generate and download room allocation capacity, spot vacancy status CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-orange-400" />
                    <span>Rooms CSV</span>
                  </button>
                  <button
                    onClick={() => { playCyberBlip(); exportRentLedgerToCSV(); }}
                    className="flex flex-1 sm:flex-initial items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white hover:border-slate-700 border border-slate-800 text-slate-300 text-[10px] font-black uppercase font-mono tracking-wider rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                    title="Generate and download historical and pending rent ledger payments CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rent Ledger CSV</span>
                  </button>
                </div>
              </div>

              {/* View Selector Toggle (Operational Control center Dashboard) */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-2 border border-slate-850 bg-slate-950 p-1.5 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => setManagerView('tickets')}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'tickets'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  Incidents Hub
                </button>
                <button
                  type="button"
                  onClick={() => setManagerView('access')}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'access'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  Access Control ({gatePasses.filter(p => p.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setManagerView('billing')}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'billing'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CircleDollarSign className="w-4 h-4" />
                  Smart Billing
                </button>
                <button
                  type="button"
                  onClick={() => setManagerView('tenants')}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'tenants'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Tenant Directory ({tenants.length})
                </button>
                <button
                  type="button"
                  onClick={() => setManagerView('broadcasts')}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'broadcasts'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-amber-400" />
                  Announcements & Menu
                </button>
                <button
                  type="button"
                  onClick={() => setManagerView('lostfound')}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'lostfound'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Search className="w-4 h-4 text-[#f6aa8e]" />
                  Lost & Found Desk ({lostFoundItems.filter(item => item.status === 'active').length})
                </button>
                <button
                  type="button"
                  onClick={() => { setManagerView('rent'); playCyberBlip(); }}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'rent'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#f05d24] fill-[#f05d24] animate-pulse" />
                  Rent Ledger
                </button>
                <button
                  type="button"
                  onClick={() => { setManagerView('payroll'); playCyberBlip(); }}
                  className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                    managerView === 'payroll'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 shadow-glow-blue'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Database className="w-4 h-4 text-[#f6aa8e]" />
                  Payroll Tab
                </button>
                {isDirector ? (
                  <button
                    type="button"
                    onClick={() => { setManagerView('inventory'); playCyberBlip(); }}
                    className={`py-2.5 px-2 rounded-lg text-[11px] xl:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full ${
                      managerView === 'inventory'
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-900/20 shadow-[#f05d24]/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bed className="w-4 h-4 text-orange-400" />
                    Seat ({seatInventory.occupiedBeds}/{seatInventory.totalBeds})
                  </button>
                ) : (
                  <div className="hidden lg:block"></div>
                )}
              </div>

              {/* View 1: RESOLVER HUB */}
              {managerView === 'tickets' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {/* COMPREHENSIVE RECHARTS DATA VISUALIZATION SECTION */}
                  <div className="bg-white border border-[#E5DCD3] rounded-2xl p-6 shadow-sm mb-6" id="ops-analytics-section">
                    <div className="flex items-center gap-2 pb-4 border-b border-[#F0E6DC] mb-6">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F15A24]"></span>
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#4E2817] font-sans flex items-center gap-1.5">
                        Operational Analytics Desk
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono ml-auto">WEEKLY COMPLAINT & TREND PROFILE</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Pie Chart of Tickets by Category */}
                      <div className="bg-[#FCFAF7] border border-[#F0E6DC] rounded-xl p-4 flex flex-col h-[320px]">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-[#4E2817] uppercase tracking-wide">Complaints by Category Distribution</span>
                          <span className="text-[10px] bg-[#FAF6F0] px-2.5 py-0.5 rounded text-xs font-mono font-bold text-[#F15A24] border border-[#E5DCD3]">Total: {tickets.length}</span>
                        </div>
                        
                        {tickets.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-[#7C5E50] text-xs">
                            No active complaints raised to show distribution.
                          </div>
                        ) : (
                          <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="w-full sm:w-1/2 h-[200px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#FCFAF7" strokeWidth={2} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#4E2817',
                                      color: '#FCFAF7',
                                      borderRadius: '8px',
                                      border: 'none',
                                      fontSize: '11px',
                                      fontFamily: 'Open Sans, sans-serif'
                                    }}
                                    itemStyle={{ color: '#FCFAF7' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex-1 flex flex-col gap-1 text-[11px] w-full sm:w-auto px-2">
                              {pieData.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-[#4E2817] font-medium py-1 border-b border-[#FAF6F0] last:border-0 font-sans">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-2 rounded-full h-2 inline-block" style={{ backgroundColor: item.color }}></span>
                                    <span className="truncate">{item.name}</span>
                                  </div>
                                  <div className="flex gap-2 items-center font-mono text-[10px]">
                                    <span className="font-extrabold text-[#4E2817]">{item.value}</span>
                                    <span className="text-slate-400">({Math.round((item.value / tickets.length) * 100)}%)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bar Chart of Daily Ticket Influx Trend */}
                      <div className="bg-[#FCFAF7] border border-[#F0E6DC] rounded-xl p-4 flex flex-col h-[320px]">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-[#4E2817] uppercase tracking-wide font-sans">Daily Influx Trends (7-Day Roll)</span>
                          <span className="text-[10px] text-slate-550 italic font-mono">Real-time DB sync</span>
                        </div>

                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                              <XAxis 
                                dataKey="day" 
                                stroke="#7C5E50" 
                                fontSize={10} 
                                tickLine={false}
                                axisLine={{ stroke: '#E5DCD3' }}
                              />
                              <YAxis 
                                stroke="#7C5E50" 
                                fontSize={10} 
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={{ stroke: '#E5DCD3' }}
                              />
                              <Tooltip
                                cursor={{ fill: 'rgba(241, 90, 36, 0.05)' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-[#4E2817] text-white p-2.5 rounded-lg border-0 shadow-md text-[11px] font-sans">
                                        <p className="font-bold uppercase tracking-widest text-[#F15A24]">{data.dateFull}</p>
                                        <p className="mt-1 font-mono">🎟️ Tickets Raised: <span className="font-black text-white">{data.count}</span></p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="count" fill="#F15A24" radius={[4, 4, 0, 0]} maxBarSize={32}>
                                {barData.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.count > 0 ? '#F15A24' : '#E5DCD3'}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Sidebar filters */}
                    <div className="lg:col-span-1 space-y-5 bg-[#FCFAF7] border border-[#E5DCD3] rounded-xl p-5 text-[#4E2817]">
                      <div className="flex justify-between items-center pb-2 border-b border-[#E5DCD3]">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-[#4E2817] font-sans flex items-center gap-1.5">
                          <Filter className="w-4 h-4 text-[#F15A24]" />
                          Display Filters
                        </span>
                        <button
                          onClick={() => { setFilterCategory('all'); setFilterStatus('all'); setFilterRoom(''); setSearchQuery(''); }}
                          className="text-[10px] text-[#F15A24] hover:text-[#D94F1A] font-bold uppercase tracking-wider font-sans underline cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>

                      {/* Query Search */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#7C5E50] tracking-wider block font-sans">Search ID / Resident Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="e.g., Elena"
                            className="w-full bg-white border border-[#E5DCD3] focus:border-[#F15A24] rounded-xl py-2 px-3 pl-8 text-xs text-[#4E2817] outline-none placeholder:text-slate-400"
                          />
                          <Search className="absolute left-2.5 top-2.5 text-[#7C5E50] w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#7C5E50] tracking-wider block font-sans">Category Filter</label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full bg-white border border-[#E5DCD3] focus:border-[#F15A24] rounded-xl p-2.5 text-xs text-[#4E2817] outline-none cursor-pointer"
                        >
                          <option value="all">All Incident Categories</option>
                          <option value="food">Food & Meals</option>
                          <option value="housekeeping">Housekeeping</option>
                          <option value="laundry">Laundry Service</option>
                          <option value="maintenance">Maintenance & Repairs</option>
                          <option value="sales">Billing / Sales Actions</option>
                          <option value="other">Other Concerns / General</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#7C5E50] tracking-wider block font-sans">Incident Status</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full bg-white border border-[#E5DCD3] focus:border-[#F15A24] rounded-xl p-2.5 text-xs text-[#4E2817] outline-none cursor-pointer"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>

                      {/* Room */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#7C5E50] tracking-wider block font-sans">Room Number Search</label>
                        <input
                          type="text"
                          value={filterRoom}
                          onChange={(e) => setFilterRoom(e.target.value)}
                          placeholder="e.g., 302A"
                          className="w-full bg-white border border-[#E5DCD3] focus:border-[#F15A24] rounded-xl p-2.5 text-xs text-[#4E2817] font-mono outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    {/* Incident Feed */}
                    <div className="lg:col-span-3 space-y-4">
                      <div className="bg-white border border-[#E5DCD3] rounded-xl p-5 min-h-[50vh] shadow-sm">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5DCD3] mb-4 gap-3">
                          <span className="text-xs font-extrabold uppercase tracking-widest text-[#4E2817] font-sans">
                            Active Incidents Under Scope ({sortedTickets.length})
                          </span>

                          {/* Quick Sort Dropdown Control */}
                          <div className="flex items-center gap-2" id="quick-sort-dropdown-container">
                            <span className="text-[10px] uppercase font-black text-[#7C5E50] tracking-widest font-sans whitespace-nowrap">
                              ⚡ Quick Sort:
                            </span>
                            <select
                              id="quick-sort"
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="bg-[#FCFAF7] border border-[#E5DCD3] text-[#4E2817] focus:border-[#F15A24] rounded-lg px-2.5 py-1.5 text-[11px] font-bold outline-none cursor-pointer focus:ring-1 focus:ring-[#F15A24]/30"
                            >
                              <option value="recency">Recency (Newest to Oldest)</option>
                              <option value="priority">Priority (Urgent to Low)</option>
                            </select>
                          </div>
                        </div>

                        {sortedTickets.length === 0 ? (
                          <div className="py-16 text-center">
                            <CheckCircle className="w-10 h-10 text-[#C4B5A5] mx-auto mb-3" />
                            <h4 className="text-xs font-bold text-[#7C5E50] uppercase tracking-widest">No Incidents Met Your Search Parameters</h4>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sortedTickets.map((ticket) => {
                              return (
                                <div
                                  key={ticket.id}
                                  className="bg-[#FCFAF7] border border-[#E5DCD3] hover:border-[#F15A24]/45 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer"
                                >
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[9px] font-mono text-[#7C5E50] bg-[#FAF6F0] px-1.5 py-0.5 border border-[#E5DCD3] rounded font-semibold">
                                        ID: {ticket.id}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold text-[#F15A24] bg-[#FAF6F0] px-1.5 py-0.5 border border-[#E5DCD3] rounded">
                                        Room: {ticket.roomNumber}
                                      </span>
                                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded border ${
                                        ticket.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200' :
                                        ticket.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                        ticket.priority === 'medium' ? 'bg-blue-50/75 text-blue-700 border-blue-200' :
                                        'bg-gray-50 text-gray-600 border-gray-200'
                                      }`}>
                                        {ticket.priority} priority
                                      </span>
                                    </div>
                                    
                                    <h4 className="text-xs font-extrabold text-[#4E2817] tracking-wide mt-1.5 py-0.5 font-sans">
                                      {ticket.title}
                                    </h4>
                                    
                                    <div className="text-[10px] text-[#7C5E50] flex gap-2 font-mono items-center uppercase mt-1">
                                      <span>Reporter: <strong className="text-[#4E2817] font-bold">{ticket.tenantName}</strong></span>
                                      <span>•</span>
                                      <span>Category: <strong className="text-[#4E2817] font-bold">{ticket.category}</strong></span>
                                      {ticket.followupCount > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="text-[#F15A24] font-black">Follow up Spur ({ticket.followupCount})</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#E5DCD3] pt-2 md:pt-0">
                                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded border ${
                                      ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      ticket.status === 'in-progress' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                      'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
                                    }`}>
                                      {ticket.status}
                                    </span>

                                    {ticket.status !== 'resolved' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleFastResolve(ticket.id);
                                        }}
                                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider cursor-pointer font-sans shadow-md shadow-emerald-600/10 transition-all hover:scale-[1.02] flex items-center gap-1.5"
                                      >
                                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                        Fast-Resolve
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setSelectedTicket(ticket)}
                                      className="px-4 py-2 bg-[#F15A24] hover:bg-[#D94F1A] text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans shadow-md shadow-[#F15A24]/10 transition-all hover:scale-[1.02]"
                                    >
                                      Inspect / Resolve Logs ({ticket.comments.length})
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                </motion.div>
            )}


              {/* View 2: ACCESS CONTROL (GATE PASSES APPROVAL DESK) */}
              {managerView === 'access' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-[#0A0B1A]/95 border border-slate-850 rounded-2xl p-6 min-h-[55vh] shadow-[0_0_35px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-rose-950/20 mb-6 gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#4E88FF] font-mono flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-blue-500 animate-pulse" />
                        Gate Pass Clearance & Access Control Desk
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Audit, approve or deny leave of absence and late entry passes for residents.</p>
                    </div>
                    <span className="text-xs font-mono bg-blue-950/50 font-bold border border-blue-900/40 text-blue-400 px-3 py-1 rounded">
                      In Queue: {gatePasses.filter(p => p.status === 'pending').length} Actionable Pass(es)
                    </span>
                  </div>

                  {gatePasses.length === 0 ? (
                    <div className="py-20 text-center">
                      <ShieldCheck className="w-12 h-12 text-slate-700/80 mx-auto mb-3" />
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">No Gate Passes Requested</h4>
                      <p className="text-[10px] text-slate-600 mt-1.5 uppercase max-w-sm mx-auto leading-relaxed">
                        Resident register matches on-site roster bounds.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {[...gatePasses]
                        .sort((a, b) => (a.status === 'pending' ? -1 : 1))
                        .map((pass) => (
                          <div 
                            key={pass.id} 
                            className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                              pass.status === 'pending' 
                                ? 'bg-[#0E1235]/60 border-blue-500/35 shadow-lg shadow-blue-950/20' 
                                : 'bg-slate-950/50 border-slate-900/60 opacity-80'
                            }`}
                          >
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex justify-between items-start gap-3 pl-1">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-extrabold text-white tracking-wide">{pass.tenantName}</h4>
                                  <span className="text-[9px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 border border-slate-900 rounded font-bold">
                                    Room {pass.roomNumber}
                                  </span>
                                  {pass.type === 'leave' ? (
                                    <span className="text-[8px] bg-amber-950/70 border border-amber-900/30 text-amber-400 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wide">
                                      ✈ Vacation Leave
                                    </span>
                                  ) : pass.type === 'late-entry' ? (
                                    <span className="text-[8px] bg-red-950/70 border border-red-900/30 text-red-400 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wide">
                                      ⏰ Late Entry
                                    </span>
                                  ) : (
                                    <span className="text-[8px] bg-purple-950/70 border border-purple-900/30 text-purple-400 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wide">
                                      👥 Visitor Pass
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono block mt-1">ID: {pass.id}</span>
                              </div>

                              <div>
                                {pass.status === 'approved' ? (
                                  <span className="px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded text-[9px] font-extrabold uppercase tracking-widest font-mono">
                                    Approved
                                  </span>
                                ) : pass.status === 'rejected' ? (
                                  <span className="px-2 py-0.5 bg-red-950/60 border border-red-500/30 text-red-400 rounded text-[9px] font-extrabold uppercase tracking-widest font-mono">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-950/60 border border-amber-500/30 text-amber-400 rounded text-[9px] font-extrabold uppercase tracking-widest font-mono animate-pulse">
                                    Pending Decision
                                  </span>
                                )}
                              </div>
                            </div>

                            <hr className="border-slate-900/60 my-4" />

                            {pass.type === 'visitor' ? (
                              <div className="space-y-2 text-[11px] text-slate-300 pl-1">
                                <div className="flex justify-between items-center font-mono text-[10px]">
                                  <span className="text-slate-500 uppercase tracking-wider font-extrabold text-[8px]">Guest Name</span>
                                  <span className="text-white font-bold">{pass.visitorName}</span>
                                </div>
                                <div className="flex justify-between items-center font-mono text-[10px]">
                                  <span className="text-slate-500 uppercase tracking-wider font-extrabold text-[8px]">Relation</span>
                                  <span className="text-slate-200">{pass.visitorRelation}</span>
                                </div>
                                <div className="flex justify-between items-center font-mono text-[10px]">
                                  <span className="text-slate-500 uppercase tracking-wider font-extrabold text-[8px]">Visit Date</span>
                                  <span className="text-slate-200 font-bold">{pass.visitDate}</span>
                                </div>
                                <div className="flex justify-between items-center font-mono text-[10px]">
                                  <span className="text-slate-500 uppercase tracking-wider font-extrabold text-[8px]">Arrival Time</span>
                                  <span className="text-slate-200 font-bold">{pass.visitTime}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 text-[11px] text-slate-300 pl-1">
                                <div className="flex justify-between items-center font-mono text-[10px]">
                                  <span className="text-slate-500 uppercase tracking-wider font-extrabold text-[8px]">Departure</span>
                                  <span className="text-slate-200">{pass.departureDate}</span>
                                </div>
                                <div className="flex justify-between items-center font-mono text-[10px]">
                                  <span className="text-slate-500 uppercase tracking-wider font-extrabold text-[8px]">Expected Return</span>
                                  <span className="text-slate-200">{pass.returnDate}</span>
                                </div>
                                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 mt-2">
                                  <span className="text-[8px] uppercase font-bold text-slate-500 block font-mono mb-1">Reason for Absconding</span>
                                  <span className="text-slate-300 leading-normal italic text-[11px]">"{pass.reason}"</span>
                                </div>
                              </div>
                            )}

                            {pass.status === 'pending' && (
                              <div className="flex gap-2.5 mt-4 pt-3 border-t border-slate-900/60 pl-1">
                                <button
                                  onClick={() => handleResolveGatePass(pass.id, 'approved')}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-md shadow-emerald-950/10 active:scale-95 text-center font-mono"
                                >
                                  Approve Pass ✓
                                </button>
                                <button
                                  onClick={() => handleResolveGatePass(pass.id, 'rejected')}
                                  className="flex-1 py-1.5 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 font-extrabold text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer active:scale-95 text-center font-mono"
                                >
                                  Reject Pass
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </motion.div>
              )}

              {/* View 3: SMART BILLING & FINANCIAL CONTROL CENTER */}
              {managerView === 'billing' && (() => {
                const totalTarget = tenants.reduce((acc, t) => acc + (t.rentAmount || 11000), 0);
                const totalPaid = tenants.filter(t => t.paymentStatus === 'paid').reduce((acc, t) => acc + (t.rentAmount || 11000), 0);
                const totalDue = totalTarget - totalPaid;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="bg-[#0A0B1A]/95 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-6"
                  >
                    <div className="flex justify-between items-center pb-4 border-b border-slate-850/60">
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#f05d24] font-mono flex items-center gap-2">
                          <CircleDollarSign className="w-5 h-5 text-cyan-400" />
                          Rent Collection & Overhead Ledger
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Real-time ledger matching rent receipts to tracking overhead metrics.</p>
                      </div>
                    </div>

                    {/* METRICS CARD BENTO BOX */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                        <span className="text-[8px] uppercase font-bold text-slate-500 font-mono tracking-wider">FIXED PROPERTY RENT (OVERHEAD)</span>
                        <span className="text-lg font-black text-[#F15A24] block font-mono mt-1">₹2,50,000</span>
                        <p className="text-[9px] text-[#F15A24]/75 mt-0.5 uppercase tracking-wide font-mono">Zora Property Base rent</p>
                      </div>
                      
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                        <span className="text-[8px] uppercase font-bold text-slate-500 font-mono tracking-wider">MONTHLY RESERVATION POTENTIAL</span>
                        <span className="text-lg font-black text-blue-400 block font-mono mt-1">₹{totalTarget.toLocaleString('en-IN')}</span>
                        <p className="text-[9px] text-blue-400/75 mt-0.5 uppercase tracking-wide font-mono">Dynamic Booking Yield Range</p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                        <span className="text-[8px] uppercase font-bold text-slate-500 font-mono tracking-wider">TOTAL FEES COLLECTED</span>
                        <span className="text-lg font-black text-emerald-400 block font-mono mt-1">₹{totalPaid.toLocaleString('en-IN')}</span>
                        <p className="text-[9px] text-emerald-400/75 mt-0.5 uppercase tracking-wide font-mono">₹{(totalPaid / (totalTarget || 1) * 100).toFixed(0)}% Ledger cleared</p>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                        <span className="text-[8px] uppercase font-bold text-slate-500 font-mono tracking-wider">OUTSTANDING RENT RECEIVABLE</span>
                        <span className={`text-lg font-black block font-mono mt-1 ${totalDue > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
                          ₹{totalDue.toLocaleString('en-IN')}
                        </span>
                        <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wide font-mono">Awaiting Bank Transfer</p>
                      </div>
                    </div>

                    {/* FINANCIAL ROSTER TABLE */}
                    <div className="bg-[#0B0D1E] border border-slate-900 rounded-xl overflow-hidden shadow-inner">
                      <div className="p-4 border-b border-slate-900 bg-slate-950/80 flex justify-between items-center">
                        <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest font-mono">Financial Residents Ledger ({tenants.length} tenants)</span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase font-semibold">Overdue status triggers sound cues</span>
                      </div>
                      <div className="divide-y divide-slate-900 overflow-y-auto max-h-[420px]">
                        {tenants.map(t => (
                          <div key={t.tenantId} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-950/30 transition-all">
                            <div className="flex gap-3 items-center">
                              <img src={t.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50"} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-slate-850" />
                              <div>
                                <h4 className="text-xs font-semibold text-white">{t.name}</h4>
                                <div className="flex gap-2 text-[9px] font-mono text-slate-500 uppercase mt-0.5 font-bold">
                                  <span className="text-slate-400">Room {t.roomNumber}</span>
                                  <span>•</span>
                                  <span>UID: {t.tenantId}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                              <div className="text-right font-mono min-w-[125px]">
                                <span className="text-xs text-slate-200 font-extrabold block">₹{(t.rentAmount || 11000).toLocaleString('en-IN')}</span>
                                <span className="text-[8px] text-slate-500 font-bold block uppercase mt-0.5">DUES: {t.dueDate || '2026-06-05'}</span>
                              </div>

                              <div>
                                {t.paymentStatus === 'paid' ? (
                                  <span className="px-2.5 py-0.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 rounded text-[9px] font-extrabold uppercase tracking-widest font-mono">
                                    Settled
                                  </span>
                                ) : t.paymentStatus === 'overdue' ? (
                                  <span className="px-2.5 py-0.5 bg-red-950/60 border border-red-500/30 text-red-400 rounded text-[9px] font-extrabold uppercase tracking-widest font-mono animate-pulse">
                                    Overdue
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 bg-amber-950/50 border border-amber-500/30 text-amber-400 rounded text-[9px] font-extrabold uppercase tracking-widest font-mono animate-pulse">
                                    Pending
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-1.5 flex-wrap">
                                {t.paymentStatus !== 'paid' ? (
                                  <button
                                    onClick={() => handleSendBillReminder(t.tenantId)}
                                    className="px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-500/30 cursor-pointer active:scale-95 transition-all shadow shadow-red-950/50"
                                  >
                                    Send Reminder 🔔
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 px-3 py-1.5 bg-emerald-950/15 rounded border border-emerald-500/20 font-bold font-mono uppercase tracking-wider">Settled ✓</span>
                                )}

                                <button
                                  onClick={async () => {
                                    const nextStatus = t.paymentStatus === 'paid' ? 'pending' : 'paid';
                                    const updated = { ...t, paymentStatus: nextStatus };
                                    await dbService.saveTenant(updated);

                                    // Real-time sync: Create or update corresponding RentPayment
                                    const paymentId = `RENT-${t.tenantId}-2026-06`;
                                    const rentPay: RentPayment = {
                                      id: paymentId,
                                      tenantId: t.tenantId,
                                      tenantName: t.name,
                                      roomNumber: t.roomNumber,
                                      amount: t.rentAmount || 11000,
                                      month: "June 2026",
                                      status: nextStatus === 'paid' ? 'paid' : 'pending',
                                      paidAt: nextStatus === 'paid' ? new Date().toISOString() : undefined
                                    };
                                    await dbService.saveRentPayment(rentPay);

                                    playSuccessTone();
                                    addToast("Ledger Updated", `${t.name} payment state toggled to '${nextStatus}'`, "success");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                                >
                                  Modify Status
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* View 4: TENANT ROSTER DIRECTORY */}
              {managerView === 'tenants' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-[#0A0B1A]/95 border border-slate-850 rounded-2xl p-6 min-h-[55vh] shadow-xl"
                >
                  {(() => {
                    const inspectingResident = tenants.find(t => t.tenantId === inspectingResidentId);
                    
                    if (inspectingResident) {
                      return (
                        <div className="space-y-6 animate-fadeIn" id="individual-tenant-profile-page">
                          {/* Back button and profile title */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setInspectingResidentId(null)}
                                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                              >
                                🏢 Back to Directory
                              </button>
                              <div>
                                <h3 className="text-sm font-extrabold pb-0.5 uppercase tracking-wider text-[#f05d24] font-mono flex items-center gap-2">
                                  Resident Profile Dossier
                                </h3>
                                <p className="text-[11px] text-slate-400">Detailed overview of active contract, documents verification and emergency protocols.</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2.5 items-center flex-wrap">
                              <button
                                onClick={() => {
                                  setEditingTenant(inspectingResident);
                                  setIsEditTenantModalOpen(true);
                                }}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-950/15 active:scale-95 transition-all"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                                Edit Profile Parameters
                              </button>

                              <button
                                onClick={() => {
                                  setTenantIdToDelete(inspectingResident.tenantId);
                                }}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-400 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/15 active:scale-95 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                                Delete Resident
                              </button>
                            </div>
                          </div>

                          {/* Dossier Grid Panels */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/20 p-6 rounded-2xl border border-slate-850/60">
                            {/* Profile Photo and core metrics */}
                            <div className="flex flex-col items-center justify-center bg-[#0d0f2b]/40 p-6 rounded-2xl border border-slate-800/80 text-center col-span-1 md:col-span-2 shadow-sm">
                              <img 
                                src={inspectingResident.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"} 
                                referrerPolicy="no-referrer" 
                                className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/30 neon-glow-blue p-0.5 mb-3 shadow-md" 
                              />
                              <h4 className="text-base font-extrabold text-white tracking-wide">{inspectingResident.name}</h4>
                              <p className="text-[11px] font-mono text-slate-500 mt-1">Unique Identifier: <span className="text-slate-300 font-bold">{inspectingResident.tenantId}</span></p>
                              
                              <div className="flex gap-2.5 mt-4 flex-wrap justify-center">
                                {inspectingResident.statusBadge === 'leave' ? (
                                  <span className="px-3 py-1 text-[9px] font-black uppercase bg-amber-950/60 border border-amber-500/30 text-amber-400 rounded-full font-mono tracking-wider">
                                    ✈ On Leave
                                  </span>
                                ) : inspectingResident.statusBadge === 'late' ? (
                                  <span className="px-3 py-1 text-[9px] font-black uppercase bg-red-950/60 border border-red-500/30 text-red-400 rounded-full font-mono tracking-wider animate-pulse">
                                    ⏰ Late Entry
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 text-[9px] font-black uppercase bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-full font-mono tracking-wider">
                                    🏠 In Hostel
                                  </span>
                                )}
                                <span className="px-3 py-1 text-[9px] font-black bg-blue-950/80 border border-blue-900/40 text-blue-400 font-mono uppercase tracking-widest rounded-full">
                                  Room {inspectingResident.roomNumber} ({inspectingResident.sharingType} Share)
                                </span>
                              </div>
                            </div>

                            {/* Category 1: Personal Info */}
                            <div className="space-y-4 bg-slate-900/25 p-5 rounded-xl border border-slate-850/65 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#f05d24] font-mono pb-2 border-b border-slate-800/60 flex items-center gap-1.5 mb-3">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                                  1. Personal Info
                                </h4>
                                <div className="space-y-3 text-xs">
                                  <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                    <span className="text-slate-450 font-medium">Full Name</span>
                                    <span className="text-white font-semibold">{inspectingResident.name}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                    <span className="text-slate-450 font-medium">Phone Number</span>
                                    <span className="text-slate-200 font-mono font-bold select-all">{inspectingResident.phoneNumber}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                    <span className="text-slate-450 font-medium">Email Address</span>
                                    <span className="text-blue-400 font-mono select-all font-light">{inspectingResident.mailId}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-0.5">
                                    <span className="text-slate-450 font-medium font-sans">Emergency Contact</span>
                                    <span className="text-amber-400 font-semibold text-right select-all" title={inspectingResident.emergencyContact}>
                                      {inspectingResident.emergencyContact || 'Not Specified'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Category 2: Stay Details */}
                            <div className="space-y-4 bg-slate-900/25 p-5 rounded-xl border border-slate-850/65">
                              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#f05d24] font-mono pb-2 border-b border-slate-800/60 flex items-center gap-1.5 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-555"></span>
                                2. Stay Details
                              </h4>
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Assigned Bed/Room</span>
                                  <span className="text-white font-mono bg-slate-950 border border-slate-900 px-2 py-0.5 rounded font-bold">Room {inspectingResident.roomNumber} {inspectingResident.bedNumber ? `• Slot ${inspectingResident.bedNumber}` : ''}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Room Sharing Category</span>
                                  <span className="text-slate-300">{inspectingResident.sharingType} Share Layout</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Assigned Move-in Date</span>
                                  <span className="text-slate-300 font-mono font-semibold">{inspectingResident.residingSince || 'Not stated'}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Gender Info</span>
                                  <span className="text-slate-350">{inspectingResident.gender}</span>
                                </div>
                                <div className="pt-1 flex flex-col gap-1.5 text-left">
                                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Permanent Home Address</span>
                                  <p className="text-[11px] text-slate-450 bg-slate-950/60 p-2 border border-slate-900 rounded-lg whitespace-pre-wrap leading-normal">
                                    {inspectingResident.address || 'Not Specified'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Category 3: Financials */}
                            <div className="space-y-4 bg-slate-900/25 p-5 rounded-xl border border-slate-850/65">
                              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#f05d24] font-mono pb-2 border-b border-slate-800/60 flex items-center gap-1.5 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                3. Financial Agreement
                              </h4>
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Agreed Monthly Rent</span>
                                  <span className="text-emerald-400 font-bold font-mono">${(inspectingResident.rentAmount || 11000).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Current Invoice State</span>
                                  <span className="text-[11px]">
                                    {inspectingResident.paymentStatus === 'paid' ? (
                                      <span className="px-2 py-0.5 text-[9px] bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 font-extrabold rounded-full font-mono uppercase">
                                        Settled ✓
                                      </span>
                                    ) : inspectingResident.paymentStatus === 'overdue' ? (
                                      <span className="px-2 py-0.5 text-[9px] bg-red-950/50 border border-red-500/20 text-red-400 font-extrabold rounded-full font-mono uppercase animate-pulse">
                                        Overdue 🚨
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 text-[9px] bg-amber-950/50 border border-amber-500/20 text-amber-400 font-extrabold rounded-full font-mono uppercase">
                                        Pending ⏳
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Rent Due Date</span>
                                  <span className="text-slate-350 font-mono font-bold">{inspectingResident.dueDate || '2026-06-05'}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                  <span className="text-slate-450 font-medium">Security Deposit Held</span>
                                  <span className="text-slate-300 font-mono font-semibold">${(inspectingResident.securityDepositAmount !== undefined ? inspectingResident.securityDepositAmount : 15000).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-0.5">
                                  <span className="text-slate-450 font-medium">Deposit Ledger Status</span>
                                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                                    {inspectingResident.securityDepositStatus === 'paid' ? (
                                      <span className="text-emerald-400 bg-emerald-950/30 border border-emerald-550/20 px-2 py-0.5 rounded">🟢 Secured & Held</span>
                                    ) : inspectingResident.securityDepositStatus === 'refunded' ? (
                                      <span className="text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">⚪ Refunded</span>
                                    ) : (
                                      <span className="text-amber-450 bg-amber-950/30 border border-amber-550/20 px-2 py-0.5 rounded">🟡 Pending clearance</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Category 4: Documents Info */}
                            <div className="space-y-4 bg-slate-900/25 p-5 rounded-xl border border-slate-850/65 flex flex-col justify-between">
                              <div>
                                <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#f05d24] font-mono pb-2 border-b border-slate-800/60 flex items-center gap-1.5 mb-3">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                  4. Documents & verification
                                </h4>
                                <div className="space-y-3 text-xs">
                                  <div className="flex justify-between items-center py-0.5 border-b border-slate-900/30">
                                    <span className="text-slate-450 font-medium">ID Proof Document Category</span>
                                    <span className="text-indigo-400 font-semibold font-mono bg-indigo-950/35 px-2 py-0.5 rounded border border-indigo-900/40">
                                      {inspectingResident.idProofType || 'Passport Identification'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-0.5">
                                    <span className="text-slate-450 font-medium">Verification Status</span>
                                    <span className="text-[11px]">
                                      {inspectingResident.idProofStatus === 'verified' ? (
                                        <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/20 text-emerald-400 font-extrabold rounded-full font-mono uppercase">
                                          🛡️ Verified & Clear
                                        </span>
                                      ) : inspectingResident.idProofStatus === 'rejected' ? (
                                        <span className="px-2.5 py-0.5 bg-red-950 border border-red-500/20 text-red-400 font-extrabold rounded-full font-mono uppercase">
                                          ❌ Rejected / Re-upload
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 bg-yellow-950 border border-yellow-550/20 text-yellow-400 font-extrabold rounded-full font-mono uppercase animate-pulse">
                                          ⌛ Pending Verification
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-4 p-3 bg-blue-950/15 rounded-xl border border-blue-500/10 text-[10px] text-blue-400 leading-normal">
                                Ensure national compliance protocols. Verification badge toggles are accessible within the Profile Customization overlay.
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80 mb-6">
                          <div>
                            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#f05d24] font-mono flex items-center gap-2">
                              <Users className="w-5 h-5 text-[#f05d24]" />
                              Premium Tenant Directory & Scheduling
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Manage residency data, room allocations and live attendance status.</p>
                          </div>

                          <button
                            onClick={() => setIsAddTenantModalOpen(true)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/15 active:scale-95 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Enroll New Resident
                          </button>
                        </div>

                        {/* Search, Filter, Sort and View-Toggle controls */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-950/40 p-4 border border-slate-900 rounded-xl">
                          {/* Search bar */}
                          <div className="relative flex-1 max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                              <Search className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-1000 border border-slate-850 focus:border-blue-500 rounded-xl text-white outline-none font-mono placeholder:text-slate-500 bg-slate-950"
                              placeholder="Filter by resident name, room, mail, or UID..."
                              value={tenantSearchQuery}
                              onChange={(e) => setTenantSearchQuery(e.target.value)}
                            />
                            {tenantSearchQuery && (
                              <button 
                                onClick={() => setTenantSearchQuery('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-mono text-slate-500 hover:text-slate-350 cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Controls & Quick Action Sorters */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Sort Active Columns:</span>
                            
                            <button
                              onClick={() => {
                                if (tenantSortKey === 'paymentStatus') {
                                  setTenantSortOrder(tenantSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setTenantSortKey('paymentStatus');
                                  setTenantSortOrder('asc'); // Priority defaults to earliest/highest priority
                                }
                                playCyberBlip();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-extrabold font-mono tracking-wide border transition-all cursor-pointer ${
                                tenantSortKey === 'paymentStatus'
                                  ? 'bg-orange-600/10 border-orange-500/50 text-orange-400'
                                  : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Payment Status {tenantSortKey === 'paymentStatus' && (tenantSortOrder === 'asc' ? '▲' : '▼')}
                            </button>

                            <button
                              onClick={() => {
                                if (tenantSortKey === 'residingSince') {
                                  setTenantSortOrder(tenantSortOrder === 'asc' ? 'desc' : 'asc');
                                } else {
                                  setTenantSortKey('residingSince');
                                  setTenantSortOrder('asc');
                                }
                                playCyberBlip();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-extrabold font-mono tracking-wide border transition-all cursor-pointer ${
                                tenantSortKey === 'residingSince'
                                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                  : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Move-In Date {tenantSortKey === 'residingSince' && (tenantSortOrder === 'asc' ? '▲' : '▼')}
                            </button>

                            <span className="w-px h-4 bg-slate-800 mx-1 hidden sm:inline" />

                            {/* View selection tabs */}
                            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-xl border border-slate-900 ml-auto select-none">
                              <button
                                onClick={() => { setTenantViewMode('table'); playCyberBlip(); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-black font-mono tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                                  tenantViewMode === 'table'
                                    ? 'bg-blue-600 border border-blue-550/35 text-white shadow-sm'
                                    : 'text-slate-450 hover:text-slate-250'
                                }`}
                                title="Interactive Column-Sorted Table View"
                              >
                                <Table className="w-3.5 h-3.5" />
                                Table
                              </button>
                              <button
                                onClick={() => { setTenantViewMode('grid'); playCyberBlip(); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] uppercase font-black font-mono tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                                  tenantViewMode === 'grid'
                                    ? 'bg-blue-600 border border-blue-550/35 text-white shadow-sm'
                                    : 'text-slate-450 hover:text-slate-250'
                                }`}
                                title="Card Grid View"
                              >
                                <Grid className="w-3.5 h-3.5" />
                                Grid
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Roster list representation */}
                        {(() => {
                          const filteredTenants = tenants.filter((resident) => {
                            const query = tenantSearchQuery.toLowerCase().trim();
                            if (!query) return true;
                            return (
                              resident.name.toLowerCase().includes(query) ||
                              resident.roomNumber.toLowerCase().includes(query) ||
                              resident.tenantId.toLowerCase().includes(query) ||
                              (resident.mailId && resident.mailId.toLowerCase().includes(query))
                            );
                          });

                          const sortedAndFilteredTenants = [...filteredTenants].sort((a, b) => {
                            let comparison = 0;
                            if (tenantSortKey === 'name') {
                              comparison = a.name.localeCompare(b.name);
                            } else if (tenantSortKey === 'roomNumber') {
                              const roomNumA = parseInt(a.roomNumber) || 0;
                              const roomNumB = parseInt(b.roomNumber) || 0;
                              comparison = roomNumA - roomNumB || a.roomNumber.localeCompare(b.roomNumber);
                            } else if (tenantSortKey === 'residingSince') {
                              const dateA = a.residingSince ? new Date(a.residingSince).getTime() : 0;
                              const dateB = b.residingSince ? new Date(b.residingSince).getTime() : 0;
                              comparison = dateA - dateB;
                            } else if (tenantSortKey === 'paymentStatus') {
                              // Prioritize overdue payments first
                              const priority: Record<string, number> = { overdue: 0, pending: 1, paid: 2 };
                              const pA = priority[a.paymentStatus] ?? 99;
                              const pB = priority[b.paymentStatus] ?? 99;
                              comparison = pA - pB;
                            }
                            return tenantSortOrder === 'asc' ? comparison : -comparison;
                          });

                          const handleHeaderSort = (key: 'name' | 'roomNumber' | 'paymentStatus' | 'residingSince') => {
                            if (tenantSortKey === key) {
                              setTenantSortOrder(tenantSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setTenantSortKey(key);
                              setTenantSortOrder('asc');
                            }
                            playCyberBlip();
                          };

                          if (tenantViewMode === 'table') {
                            return (
                              <div className="overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/20 shadow-md">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-900 bg-[#0B0D1E]/80 text-[10px] font-mono tracking-wider text-slate-400 uppercase select-none">
                                      <th className="p-4 font-semibold text-slate-450">
                                        <button 
                                          type="button" 
                                          onClick={() => handleHeaderSort('name')}
                                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer outline-none"
                                        >
                                          Resident Roster {tenantSortKey === 'name' ? (tenantSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                        </button>
                                      </th>
                                      <th className="p-4 font-semibold text-slate-455">
                                        <button 
                                          type="button" 
                                          onClick={() => handleHeaderSort('roomNumber')}
                                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer outline-none"
                                        >
                                          Room ID {tenantSortKey === 'roomNumber' ? (tenantSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                        </button>
                                      </th>
                                      <th className="p-4 font-semibold text-slate-455">
                                        <button 
                                          type="button" 
                                          onClick={() => handleHeaderSort('residingSince')}
                                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer outline-none"
                                        >
                                          Move-In Date {tenantSortKey === 'residingSince' ? (tenantSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                        </button>
                                      </th>
                                      <th className="p-4 font-semibold text-slate-455">
                                        <button 
                                          type="button" 
                                          onClick={() => handleHeaderSort('paymentStatus')}
                                          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer outline-none"
                                        >
                                          Rent State {tenantSortKey === 'paymentStatus' ? (tenantSortOrder === 'asc' ? '▲' : '▼') : '↕'}
                                        </button>
                                      </th>
                                      <th className="p-4 font-semibold text-slate-450">Attendance Pass</th>
                                      <th className="p-4 font-semibold text-slate-450 text-right">Dossier Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-900/60 text-xs">
                                    {sortedAndFilteredTenants.length === 0 ? (
                                      <tr>
                                        <td colSpan={6} className="p-12 text-center font-mono text-slate-500 bg-slate-950/10">
                                          No active matching profiles registered in query check.
                                        </td>
                                      </tr>
                                    ) : (
                                      sortedAndFilteredTenants.map((resident) => (
                                        <tr 
                                          key={resident.tenantId} 
                                          className="hover:bg-slate-950/40 transition-all group border-b border-slate-900 last:border-0"
                                        >
                                          <td className="p-4">
                                            <div className="flex gap-3 items-center min-w-[180px]">
                                              <img 
                                                src={resident.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50"} 
                                                referrerPolicy="no-referrer" 
                                                className="w-10 h-10 rounded-full object-cover border border-slate-900 shrink-0 group-hover:scale-105 transition-transform" 
                                              />
                                              <div className="min-w-0">
                                                <h4 className="font-bold text-white tracking-wide truncate">{resident.name}</h4>
                                                <span className="text-[9px] font-mono text-slate-500 block">UID: {resident.tenantId}</span>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="p-4">
                                            <div className="font-mono min-w-[110px]">
                                              <span className="text-blue-400 font-extrabold text-[11px] block">● Room {resident.roomNumber}</span>
                                              <span className="text-[9px] text-slate-450 tracking-wider font-semibold uppercase">{resident.sharingType} Layout</span>
                                            </div>
                                          </td>
                                          <td className="p-4 whitespace-nowrap">
                                            <div className="font-mono text-slate-300 font-semibold">
                                              {resident.residingSince || 'Not specified'}
                                            </div>
                                          </td>
                                          <td className="p-4">
                                            <div className="flex flex-col items-start min-w-[140px] gap-1.5">
                                              {resident.paymentStatus === 'paid' ? (
                                                <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded">
                                                  Settled ✓
                                                </span>
                                              ) : resident.paymentStatus === 'overdue' ? (
                                                <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-red-950/60 border border-red-500/20 text-red-400 rounded animate-pulse">
                                                  Overdue 🚨
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-amber-950/60 border border-amber-500/20 text-amber-400 rounded">
                                                  Pending ⏳
                                                </span>
                                              )}
                                              <span className="text-[9px] font-mono text-slate-450 font-bold">
                                                Rent Amount: <span className="text-slate-300">${resident.rentAmount.toLocaleString()}</span>
                                              </span>
                                            </div>
                                          </td>
                                          <td className="p-4">
                                            <div className="flex items-center gap-2 min-w-[130px]">
                                              <select
                                                value={resident.statusBadge || 'hostel'}
                                                onChange={async (e) => {
                                                  const newBadge = e.target.value as 'hostel' | 'leave' | 'late';
                                                  const updated = { ...resident, statusBadge: newBadge };
                                                  await dbService.saveTenant(updated);
                                                  playSuccessTone();
                                                  addToast("Presence Badge Synchronized", `${resident.name} location override established: '${newBadge}'`, "success");
                                                }}
                                                className="bg-slate-950 border border-slate-900 text-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wider outline-none cursor-pointer"
                                              >
                                                <option value="hostel">🏠 In Hostel</option>
                                                <option value="leave">✈ On Leave</option>
                                                <option value="late">⏰ Late Entry</option>
                                              </select>
                                            </div>
                                          </td>
                                          <td className="p-4 text-right">
                                            <div className="flex gap-2 justify-end items-center">
                                              <button
                                                onClick={() => {
                                                  setEditingTenant(resident);
                                                  setIsEditTenantModalOpen(true);
                                                }}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold font-mono uppercase text-white rounded transition-all cursor-pointer"
                                                title="Modify Resident Details"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setInspectingResidentId(resident.tenantId);
                                                }}
                                                className="px-2 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold font-mono text-slate-300 rounded transition-all cursor-pointer"
                                                title="Inspect Individual Dossier Page"
                                              >
                                                Profile
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setTenantIdToDelete(resident.tenantId);
                                                }}
                                                className="px-2 py-1 bg-red-950/40 border border-red-900/30 text-[10px] text-red-400 hover:bg-red-900 hover:text-white rounded transition-all cursor-pointer font-bold font-mono uppercase"
                                                title="Delete Resident Profile"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }

                          // Card Grid view implementation
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {sortedAndFilteredTenants.map((resident) => {
                                return (
                                  <div
                                    key={resident.tenantId}
                                    className="bg-slate-950/60 border border-slate-900 hover:border-blue-500/40 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between transition-all shadow-md group"
                                  >
                                    {/* Live Color-Coded Resident Presence Status Badge */}
                                    <div className="absolute top-4 right-4">
                                      {resident.statusBadge === 'leave' ? (
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase bg-amber-950/60 border border-amber-500/30 text-amber-400 rounded-full font-mono tracking-wider">
                                          ✈ On Leave
                                        </span>
                                      ) : resident.statusBadge === 'late' ? (
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase bg-red-950/60 border border-red-500/30 text-red-400 rounded-full font-mono tracking-wider animate-pulse">
                                          ⏰ Late Entry
                                        </span>
                                      ) : (
                                        <span className="px-2.5 py-0.5 text-[8px] font-black uppercase bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 rounded-full font-mono tracking-wider">
                                          🏠 In Hostel
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      <div className="flex gap-4 items-start mb-4">
                                        <div className="flex flex-col items-center">
                                          <img src={resident.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50"} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover border border-slate-900 group-hover:scale-105 transition-all" />
                                          {editingPhotoId === resident.tenantId ? (
                                            <div className="flex gap-1 mt-1 justify-center border-0">
                                              <button
                                                onClick={async () => {
                                                  if (!tempPhotoUrl.trim()) return;
                                                  const updated = { ...resident, photoUrl: tempPhotoUrl.trim() };
                                                  await dbService.saveTenant(updated);
                                                  setEditingPhotoId(null);
                                                  playSuccessTone();
                                                  addToast("Resident Photo Synchronized", `${resident.name} profile image updated and pushed.`, "success");
                                                }}
                                                className="p-1 px-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[8px] font-bold font-mono transition-all cursor-pointer"
                                                title="Save Photo URL"
                                              >
                                                ✔
                                              </button>
                                              <button
                                                onClick={() => setEditingPhotoId(null)}
                                                className="p-1 px-1.5 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded text-[8px] font-mono transition-all cursor-pointer"
                                                title="Cancel"
                                              >
                                                ✖
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setEditingPhotoId(resident.tenantId);
                                                setTempPhotoUrl(resident.photoUrl || '');
                                              }}
                                              className="mt-1.5 px-1.5 py-0.5 border border-slate-800 hover:border-blue-500/40 hover:bg-blue-950/20 text-[8px] font-mono text-slate-400 hover:text-blue-400 rounded transition-all cursor-pointer"
                                              title="Edit Photo"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex justify-between items-start gap-1">
                                            <div>
                                              <h4 className="text-xs font-semibold text-white tracking-wide font-sans">{resident.name}</h4>
                                              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">UID: {resident.tenantId}</span>
                                            </div>
                                            <div className="flex flex-col gap-1 items-end shrink-0">
                                              <button
                                                onClick={() => {
                                                  setEditingTenant(resident);
                                                  setIsEditTenantModalOpen(true);
                                                }}
                                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold font-mono tracking-wider uppercase text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                                title="Modify Resident Details"
                                              >
                                                <Sliders className="w-3" />
                                                Edit
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setInspectingResidentId(resident.tenantId);
                                                }}
                                                className="px-2 py-0.5 bg-slate-900 border border-slate-850 hover:border-slate-800 hover:bg-slate-800 text-[9px] font-bold font-mono text-slate-300 rounded-lg transition-all cursor-pointer"
                                                title="Inspect Individual Dossier Page"
                                              >
                                                Profile
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setTenantIdToDelete(resident.tenantId);
                                                }}
                                                className="px-2 py-0.5 bg-red-950/40 border border-red-900/30 text-[9px] font-bold font-mono text-red-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                                title="Delete Resident Profile"
                                              >
                                                Delete
                                              </button>
                                            </div>
                                          </div>
                                          <span className="text-[9px] font-bold text-blue-400 font-mono block mt-1 uppercase tracking-wide">
                                            ● Room: {resident.roomNumber} ({resident.sharingType} Share)
                                          </span>
                                        </div>
                                      </div>

                                      {editingPhotoId === resident.tenantId && (
                                        <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl mb-4 text-left animate-fadeIn">
                                          <label className="text-[8px] uppercase font-black text-blue-400 font-mono tracking-wider block mb-1">Update Avatar URL</label>
                                          <input
                                            type="text"
                                            placeholder="Paste direct image URL..."
                                            value={tempPhotoUrl}
                                            onChange={(e) => setTempPhotoUrl(e.target.value)}
                                            className="w-full bg-slate-1000 border border-slate-800 focus:border-blue-500 rounded px-2 py-1 text-[9px] text-white outline-none font-mono mb-2 bg-slate-950"
                                          />
                                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                            <span className="text-[8px] uppercase font-bold text-slate-500 font-mono whitespace-nowrap">Presets:</span>
                                            {[
                                              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
                                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                                              "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150",
                                              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
                                              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150"
                                            ].map((av, index) => (
                                              <button
                                                key={index}
                                                onClick={() => setTempPhotoUrl(av)}
                                                className="w-5 h-5 rounded-full overflow-hidden border border-slate-800 hover:border-blue-500 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
                                              >
                                                <img src={av} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <hr className="border-slate-900/60 my-3" />

                                      <div className="space-y-1.5 text-[11px] text-slate-200">
                                        <div className="flex justify-between font-mono text-[10px]">
                                          <span className="text-slate-500 uppercase font-semibold text-[8px]">Gender Info</span>
                                          <strong>{resident.gender}</strong>
                                        </div>
                                        <div className="flex justify-between font-mono text-[10px]">
                                          <span className="text-slate-500 uppercase font-semibold text-[8px]">Contact email</span>
                                          <strong className="font-mono select-all text-slate-300">{resident.mailId}</strong>
                                        </div>
                                        <div className="flex justify-between font-mono text-[10px]">
                                          <span className="text-slate-500 uppercase font-semibold text-[8px]">Phone primary</span>
                                          <strong>{resident.phoneNumber}</strong>
                                        </div>
                                        {resident.emergencyContact && (
                                          <div className="flex justify-between font-mono text-[10px]">
                                            <span className="text-slate-500 uppercase font-semibold text-[8px]">Emergency Call</span>
                                            <strong className="text-amber-400 select-all font-semibold max-w-[120px] truncate" title={resident.emergencyContact}>{resident.emergencyContact}</strong>
                                          </div>
                                        )}
                                        <div className="flex justify-between font-mono text-[10px]">
                                          <span className="text-slate-500 uppercase font-semibold text-[8px]">Rent Policy</span>
                                          <strong className="text-slate-300 font-bold">${resident.rentAmount} ({resident.paymentStatus.toUpperCase()})</strong>
                                        </div>
                                        <div className="flex justify-between font-mono text-[10px]">
                                          <span className="text-slate-500 uppercase font-semibold text-[8px]">ID Validation</span>
                                          <strong className="text-slate-300">{resident.idProofType || 'Passport'} ({resident.idProofStatus === 'verified' ? '🛡️ Verified' : '⌛ Pending'})</strong>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-900/60 mt-3 flex justify-between items-center">
                                      {/* Live Presence Status Control Switch for ManualOverride */}
                                      <select
                                        value={resident.statusBadge || 'hostel'}
                                        onChange={async (e) => {
                                          const newBadge = e.target.value as 'hostel' | 'leave' | 'late';
                                          const updated = { ...resident, statusBadge: newBadge };
                                          await dbService.saveTenant(updated);
                                          playSuccessTone();
                                          addToast("Presence Badge Synchronized", `${resident.name} location override established: '${newBadge}'`, "success");
                                        }}
                                        className="bg-slate-950/80 border border-slate-900/80 text-slate-300 focus:border-blue-500 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer"
                                      >
                                        <option value="hostel">🏠 Set In Hostel</option>
                                        <option value="leave">✈ Set On Leave</option>
                                        <option value="late">⏰ Set Late Entry</option>
                                      </select>

                                      <span className="text-[9px] text-slate-500 font-mono">Added: {new Date(resident.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </motion.div>
              )}

              {/* View 5: ANNOUNCEMENTS & MENU HUB */}
              {managerView === 'broadcasts' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  {/* Digital Notice Board Publisher Card */}
                  <div className="bg-[#0A0B1A]/95 border border-slate-850 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80 mb-6">
                      <Megaphone className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#f05d24] font-mono">
                          Digital Bulletin & Broadcast dispatcher
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Post real-time priority alerts to be pinned at the top of resident portals instantly.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left: Input Form */}
                      <div className="md:col-span-2 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono">Notice Title</label>
                          <input
                            type="text"
                            placeholder="e.g., Scheduled Water Supply Revised Timings"
                            value={newNoticeTitle}
                            onChange={(e) => setNewNoticeTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono">Notice description / content</label>
                          <textarea
                            rows={4}
                            placeholder="A brief explanation of schedules, exceptions and helpful coordinates..."
                            value={newNoticeContent}
                            onChange={(e) => setNewNoticeContent(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none font-sans leading-relaxed"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider">Urgency:</span>
                            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
                              {(['info', 'important', 'critical'] as const).map((urg) => (
                                <button
                                  key={urg}
                                  type="button"
                                  onClick={() => setNewNoticeUrgency(urg)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                                    newNoticeUrgency === urg
                                      ? urg === 'critical'
                                        ? 'bg-red-950/80 border border-red-500/50 text-red-400 shadow-sm'
                                        : urg === 'important'
                                          ? 'bg-amber-950/80 border border-amber-500/50 text-amber-400 shadow-sm'
                                          : 'bg-blue-950/80 border border-blue-500/50 text-blue-400 shadow-sm'
                                      : 'text-slate-500 hover:text-slate-300'
                                  }`}
                                >
                                  {urg}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
                                addToast("Incomplete Notice Info", "Title and content can't be empty fields.", "warning");
                                return;
                              }
                              await handlePublishNotice(newNoticeTitle.trim(), newNoticeContent.trim(), newNoticeUrgency);
                              setNewNoticeTitle('');
                              setNewNoticeContent('');
                              setNewNoticeUrgency('info');
                            }}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider font-mono cursor-pointer transition-all active:scale-95 shadow-md shadow-blue-900/10"
                          >
                            📢 Dispatch Bulletin Notice
                          </button>
                        </div>
                      </div>

                      {/* Right: Active Notice Feed & Management */}
                      <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-mono block mb-3 border-b border-slate-900 pb-2">
                            Active Bulletin Live Feed ({notices.length})
                          </span>
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {notices.length === 0 ? (
                              <div className="text-center py-8 text-xs text-slate-500">
                                No active announcements posted on the board.
                              </div>
                            ) : (
                              notices.map((not) => (
                                <div key={not.id} className="bg-[#0A0D26]/60 border border-slate-900 p-3 rounded-xl flex justify-between gap-3 items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {not.urgency === 'critical' ? (
                                        <span className="px-1.5 py-0.5 text-[8px] bg-red-950/60 text-red-400 border border-red-500/30 rounded font-black uppercase font-mono tracking-widest">crit</span>
                                      ) : not.urgency === 'important' ? (
                                        <span className="px-1.5 py-0.5 text-[8px] bg-amber-950/60 text-amber-400 border border-amber-500/30 rounded font-black uppercase font-mono tracking-widest">imp</span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 text-[8px] bg-blue-950/60 text-blue-400 border border-blue-500/30 rounded font-black uppercase font-mono tracking-widest">info</span>
                                      )}
                                      <span className="text-[9px] text-slate-500 font-mono italic">{new Date(not.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-white mt-1 truncate">{not.title}</h4>
                                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{not.content}</p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteNotice(not.id)}
                                    className="p-1 px-2 border border-red-950/50 hover:border-red-500/30 bg-red-950/20 text-red-400 hover:text-red-300 rounded text-[9px] font-mono cursor-pointer transition-all active:scale-95 flex-shrink-0"
                                    title="Unpin alert"
                                  >
                                    Unpin
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Food Menu Updater & Live Rating Audits */}
                  <div className="bg-[#0A0B1A]/95 border border-slate-850 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6 flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-amber-400" />
                        <div>
                          <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#f05d24] font-mono">
                            Zora Mess Daily Menu Planner
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">Configure live mess menu details for any weekday to propagate to the tenant dashboard.</p>
                        </div>
                      </div>

                      {/* Day Selector */}
                      <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
                        {(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day) => {
                          const activeMeal = meals.find(m => m.day === day);
                          const upVotes = (activeMeal?.breakfastVotes.up ?? 0) + (activeMeal?.lunchVotes.up ?? 0) + (activeMeal?.dinnerVotes.up ?? 0);
                          const isSelected = menuSelectedDay === day;
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setMenuSelectedDay(day)}
                              className={`px-3 py-2 rounded-lg text-xs font-bold font-mono uppercase tracking-wider cursor-pointer flex flex-col items-center justify-center transition-all min-w-[50px] ${
                                isSelected
                                  ? 'bg-blue-600 border border-blue-500 text-white shadow-glow-blue'
                                  : 'text-slate-450 hover:text-slate-200'
                              }`}
                            >
                              <span>{day}</span>
                              <span className="text-[7px] text-slate-400">{upVotes > 0 ? `👍 ${upVotes}` : ''}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Breakfast Field */}
                      <div className="bg-slate-950/60 border border-slate-900 p-4.5 rounded-2xl space-y-3.5 relative overflow-hidden">
                        <span className="absolute top-0 left-0 w-1 h-full bg-amber-500"></span>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                          <span className="text-[10px] uppercase font-black text-amber-500 font-mono tracking-widest">Update Breakfast (7:30 AM)</span>
                          <span className="text-[9px] text-slate-500 font-mono">Rating: 👍 {meals.find(m => m.day === menuSelectedDay)?.breakfastVotes.up ?? 0} up</span>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">Main Entrée</label>
                          <input
                            type="text"
                            placeholder="e.g., Aloo Paratha with Curd"
                            value={breakfastMenuInput}
                            onChange={(e) => setBreakfastMenuInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">Sides & Beverages</label>
                          <input
                            type="text"
                            placeholder="e.g., Fresh Butter, Pickle, Cardamom Tea"
                            value={breakfastSubInput}
                            onChange={(e) => setBreakfastSubInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-sans"
                          />
                        </div>
                      </div>

                      {/* Lunch Field */}
                      <div className="bg-slate-950/60 border border-slate-900 p-4.5 rounded-2xl space-y-3.5 relative overflow-hidden">
                        <span className="absolute top-0 left-0 w-1 h-full bg-amber-500"></span>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                          <span className="text-[10px] uppercase font-black text-amber-500 font-mono tracking-widest">Update Lunch (1:30 PM)</span>
                          <span className="text-[9px] text-slate-500 font-mono">Rating: 👍 {meals.find(m => m.day === menuSelectedDay)?.lunchVotes.up ?? 0} up</span>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">Main Entrée</label>
                          <input
                            type="text"
                            placeholder="e.g., Chole Bhature or Chole Rice"
                            value={lunchMenuInput}
                            onChange={(e) => setLunchMenuInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">Sides & Beverages</label>
                          <input
                            type="text"
                            placeholder="e.g., Boondi Raita, Onion Salad, Rice Kheer"
                            value={lunchSubInput}
                            onChange={(e) => setLunchSubInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-sans"
                          />
                        </div>
                      </div>

                      {/* Dinner Field */}
                      <div className="bg-slate-950/60 border border-slate-900 p-4.5 rounded-2xl space-y-3.5 relative overflow-hidden">
                        <span className="absolute top-0 left-0 w-1 h-full bg-amber-500"></span>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                          <span className="text-[10px] uppercase font-black text-amber-500 font-mono tracking-widest">Update Dinner (8:00 PM)</span>
                          <span className="text-[9px] text-slate-500 font-mono">Rating: 👍 {meals.find(m => m.day === menuSelectedDay)?.dinnerVotes.up ?? 0} up</span>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">Main Entrée</label>
                          <input
                            type="text"
                            placeholder="e.g., Shahi Paneer & Hot Garlic Naan"
                            value={dinnerMenuInput}
                            onChange={(e) => setDinnerMenuInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">Sides & Desserts</label>
                          <input
                            type="text"
                            placeholder="e.g., Day's Sweet Kulfi, Green Salad, Dal Fry"
                            value={dinnerSubInput}
                            onChange={(e) => setDinnerSubInput(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={async () => {
                          const active = meals.find(m => m.day === menuSelectedDay);
                          if (active) {
                            setBreakfastMenuInput(active.breakfastMenu || '');
                            setBreakfastSubInput(active.breakfastSub || '');
                            setLunchMenuInput(active.lunchMenu || '');
                            setLunchSubInput(active.lunchSub || '');
                            setDinnerMenuInput(active.dinnerMenu || '');
                            setDinnerSubInput(active.dinnerSub || '');
                            addToast("Changes Reverted", `Discarded modifications for ${menuSelectedDay}.`, "info");
                          }
                        }}
                        className="px-4 py-2 border border-slate-850 hover:bg-slate-950 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-wider font-mono rounded-xl cursor-pointer transition-all"
                      >
                        Reset Fields
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await dbService.saveMealMenu(
                            menuSelectedDay,
                            breakfastMenuInput.trim(),
                            breakfastSubInput.trim(),
                            lunchMenuInput.trim(),
                            lunchSubInput.trim(),
                            dinnerMenuInput.trim(),
                            dinnerSubInput.trim()
                          );
                          playSuccessTone();
                          addToast("Menu Planner Updated", `Zora Stays ${menuSelectedDay} daily menu updated and published to tenants.`, "success");
                        }}
                        className="px-6 py-2.5 bg-[#F15A24] hover:bg-[#ff6830] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-mono cursor-pointer transition-all active:scale-95 shadow-lg shadow-orange-950/20"
                      >
                        🚀 Dispatch Daily Menu
                      </button>
                    </div>

                    {/* Weekly Satisfaction Audits Scorecard */}
                    <div className="mt-8 bg-slate-950/40 border border-slate-900/60 p-4.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-black text-slate-400 font-mono tracking-wider block mb-3">Zora Food Committee Weekly Satisfaction Statistics</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                        {meals.map((m) => {
                          const totalVotes = m.breakfastVotes.up + m.breakfastVotes.down + m.lunchVotes.up + m.lunchVotes.down + m.dinnerVotes.up + m.dinnerVotes.down;
                          const totalUp = m.breakfastVotes.up + m.lunchVotes.up + m.dinnerVotes.up;
                          const scoreRatio = totalVotes > 0 ? Math.round((totalUp / totalVotes) * 100) : 100;
                          return (
                            <div key={m.day} className="bg-slate-950/80 border border-slate-900 p-3 rounded-xl text-center">
                              <span className="text-xs font-extrabold text-white block uppercase font-mono">{m.day}</span>
                              <div className="text-[18px] font-black mt-1 font-mono text-amber-400">{scoreRatio}%</div>
                              <span className="text-[8px] text-slate-500 font-mono block mt-0.5">Approval Score</span>
                              <span className="text-[8px] text-slate-400 font-mono block mt-1">{totalVotes} Feedbacks</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* View 6: LOST & FOUND CONTROL CENTER */}
              {managerView === 'lostfound' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <LostFoundSection
                    items={lostFoundItems}
                    onToggleStatus={handleToggleLostFoundStatus}
                    onDelete={(id) => handleDeleteLostFoundItem(id)}
                    onOpenPostModal={() => setIsLostFoundModalOpen(true)}
                    userRole="manager"
                  />
                </motion.div>
              )}

              {/* View 7: SEAT INVENTORY & BEDDING MAP (DIRECTOR EXCLUSIVE) */}
              {managerView === 'inventory' && !isDirector && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="bg-slate-950 border border-red-500/30 rounded-2xl p-8 text-center max-w-md mx-auto my-12 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
                >
                  <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">Identity Assertion Alert</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Under strict Role-Based Access Control (RBAC) protocols, the Seat Inventory dashboard is reserved exclusively for the <span className="text-orange-400 font-bold uppercase">Property Director</span>.
                  </p>
                  <div className="mt-6 p-3 bg-red-950/30 border border-red-500/20 rounded-xl text-left text-[11px] font-mono text-slate-400 space-y-1">
                    <div>AUTHENTICATED ROLE: <span className="text-slate-300 font-bold">{sessionUser.info.systemRole || 'Unauthorized'}</span></div>
                    <div>PRIVILEGE ENFORCEMENT: <span className="text-red-400 font-bold">ACTIVE (DENIAL)</span></div>
                  </div>
                  <button
                    onClick={() => { setManagerView('tickets'); playCyberBlip(); }}
                    className="mt-6 w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-slate-200 hover:text-white text-xs font-bold font-mono rounded-xl border border-zinc-800 transition-colors"
                  >
                    Return to Operations Hub
                  </button>
                </motion.div>
              )}

              {managerView === 'inventory' && isDirector && (() => {
                const filteredRooms = seatInventory.rooms.filter(room => {
                  if (invFilter === 'occupied') return room.vacant === 0;
                  if (invFilter === 'vacant') return room.vacant > 0;
                  if (invFilter === 'single') return room.type === 'Single';
                  if (invFilter === 'double') return room.type === 'Double';
                  if (invFilter === 'triple') return room.type === 'Triple';
                  return true;
                });

                const occupancyPercentage = seatInventory.totalBeds > 0 
                  ? Math.round((seatInventory.occupiedBeds / seatInventory.totalBeds) * 100) 
                  : 0;

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-slate-950 via-[#0B0C1E] to-slate-950 border border-slate-850 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-orange-500/5 to-transparent rounded-full -mr-20 -mt-20"></div>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider font-mono">
                              Secure Director Desk Access
                            </span>
                          </div>
                          <h2 className="text-xl font-black text-white mt-1.5 font-sans tracking-wide flex items-center gap-2">
                            <Building className="w-5 h-5 text-orange-500" />
                            PG Real-Time Bedding & Seat Inventory Map
                          </h2>
                          <p className="text-xs text-slate-400 mt-1 max-w-xl font-sans leading-relaxed">
                            Complete dynamic telemetry of Room allotments, sharing topologies, and real-time vacancies. Direct link to check profile details and fast-allot resident guest assets.
                          </p>
                        </div>
                        <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0 self-stretch md:self-auto">
                          <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl text-right font-mono self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end">
                            <span className="text-[10px] text-slate-500">LEDGER SYNC STATUS</span>
                            <span className="text-xs text-emerald-400 font-extrabold flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              ACTIVE LIVE LINK
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto items-stretch md:items-center">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (window.confirm("Do you want to seed the active Firebase Firestore Database with verified rooms configurations and tenant spreadsheet data? This links rooms, adds Bed assignments and ₹ rent parameters.")) {
                                    await dbService.seedLiveRoomsAndTenants();
                                    addToast("Firestore Seeded", "Successfully loaded spreadsheet rooms & resident lists.", "success");
                                    playSuccessTone();
                                  }
                                } catch (err: any) {
                                  addToast("Seeding Error", err.message, "error");
                                  playBuzzer();
                                }
                              }}
                              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer uppercase tracking-wider font-mono hover:bg-slate-850"
                            >
                              <Database className="w-3.5 h-3.5 text-orange-400" />
                              Seed DB
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddRoomModalOpen(true);
                                playCyberBlip();
                              }}
                              className="bg-blue-650 hover:bg-blue-600 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] border border-blue-500/20 cursor-pointer uppercase tracking-wider font-mono active:scale-95 shadow-lg shadow-blue-950/20"
                            >
                              <Plus className="w-3.5 h-3.5 text-blue-300" />
                              Add Room Unit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAllotBedInitialRoom('');
                                setAllotBedInitialBed('');
                                setIsAllotBedModalOpen(true);
                                playCyberBlip();
                              }}
                              className="bg-orange-600 hover:bg-orange-500 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg shadow-orange-950/30 cursor-pointer uppercase tracking-wider font-mono border border-orange-500/20 active:scale-95 animate-pulse"
                            >
                              <Bed className="w-3.5 h-3.5" />
                              Allot Bed Console
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bento Stat Counters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* STAT 1: TOTAL CAPACITY */}
                      <div className="bg-[#090b1c] border border-slate-850 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-4 right-4 text-slate-800">
                          <Bed className="w-12 h-12 stroke-[1.5]" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest font-mono">Total Bed Inventory</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-black text-white font-mono text-glow-blue">{seatInventory.totalBeds}</span>
                          <span className="text-xs text-[#f6aa8e] font-mono leading-none">Beds Provisioned</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between text-[11px] font-sans">
                          <span className="text-slate-400">Total Rooms Logged</span>
                          <span className="text-white font-bold font-mono">{ROOM_DATABASE.length} Rooms</span>
                        </div>
                      </div>

                      {/* STAT 2: OCCUPIED SEATS */}
                      <div className="bg-[#090b1c] border border-slate-850 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-4 right-4 text-slate-800">
                          <CheckCircle className="w-12 h-12 stroke-[1.5]" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-orange-400 block tracking-widest font-mono">Current Live Allotments</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-black text-white font-mono text-glow-orange">{seatInventory.occupiedBeds}</span>
                          <span className="text-xs text-orange-400 font-mono leading-none">Beds Occupied</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between text-[11px] font-sans">
                          <span className="text-slate-400">Real-Time Occupancy</span>
                          <span className="text-orange-400 font-bold font-mono">{occupancyPercentage}% Rate</span>
                        </div>
                      </div>

                      {/* STAT 3: VACANT SEATS */}
                      <div className="bg-[#090b1c] border border-[#10b981]/25 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-4 right-4 text-slate-800">
                          <Sparkles className="w-12 h-12 stroke-[1.5]" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-widest font-mono">Rentable Space Vacant</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-4xl font-black text-emerald-400 font-mono text-glow-emerald">{seatInventory.vacantBeds}</span>
                          <span className="text-xs text-emerald-500 font-mono leading-none">Beds Available</span>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-900/60 flex justify-between text-[11px] font-sans">
                          <span className="text-slate-400">Immediate Vacancy Rate</span>
                          <span className="text-emerald-400 font-bold font-mono">
                            {seatInventory.totalBeds > 0 ? Math.round((seatInventory.vacantBeds / seatInventory.totalBeds) * 100) : 0}% Open
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Filter Controller Rail */}
                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-wrap gap-2 items-center justify-between">
                      <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-mono">Filter Occupancy Map:</span>
                      <div className="flex flex-wrap gap-1.5 font-mono">
                        {[
                          { key: 'all', label: 'All Rooms' },
                          { key: 'vacant', label: 'With Vacancies ✓' },
                          { key: 'occupied', label: 'Fully Booked 🔒' },
                          { key: 'single', label: 'Single Deluxe' },
                          { key: 'double', label: 'Double Shared' },
                          { key: 'triple', label: 'Triple Shared' }
                        ].map((btn) => (
                          <button
                            key={btn.key}
                            type="button"
                            onClick={() => { setInvFilter(btn.key as any); playCyberBlip(); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                              invFilter === btn.key
                                ? 'bg-orange-600 text-white shadow-md shadow-orange-950/30 font-bold'
                                : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-white'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rooms Bed Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredRooms.map((room) => {
                        const occupancyRatio = Math.round((room.occupied / room.capacity) * 100);
                        const progressBg = room.vacant === 0 
                          ? 'bg-rose-500' 
                          : room.occupied === 0 
                            ? 'bg-slate-700' 
                            : 'bg-amber-500';

                        return (
                          <div 
                            key={room.roomNumber}
                            className="bg-[#090b1c] border border-slate-850 rounded-2xl p-5 shadow-md flex flex-col justify-between hover:border-slate-700 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ease-out relative overflow-hidden"
                          >
                            {/* Room Header Info */}
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                                  <h3 className="text-sm font-black text-white font-sans tracking-wide">
                                    Room {room.roomNumber.padStart(2, '0')}
                                  </h3>
                                </div>
                                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase ${
                                  room.type === 'Single' 
                                    ? 'bg-indigo-950 border border-indigo-800 text-indigo-400' 
                                    : room.type === 'Double'
                                      ? 'bg-blue-950 border border-blue-800 text-blue-400'
                                      : 'bg-purple-950 border border-purple-800 text-purple-400'
                                }`}>
                                  {room.type}
                                </span>
                              </div>

                              {/* Progress bar / Gauge */}
                              <div className="mt-3.5 space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400">
                                  <span>Beds Reserved: {room.occupied} / {room.capacity}</span>
                                  <span className="font-mono font-bold text-white">{occupancyRatio}% Filled</span>
                                </div>
                                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={`h-full ${progressBg} transition-all duration-500`}
                                    style={{ width: `${occupancyRatio}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Beds Slots Layout */}
                              <div className="mt-5 space-y-3">
                                {Array.from({ length: room.capacity }).map((_, index) => {
                                  const bedNames = ['Bed A', 'Bed B', 'Bed C'];
                                  const currentBedName = bedNames[index];
                                  let resident: Tenant | undefined = room.tenants.find(t => 
                                    t.bedNumber === currentBedName || t.assignedBed === currentBedName
                                  );

                                  return (
                                    <div 
                                      key={index} 
                                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                        resident 
                                          ? 'bg-zinc-950 border-slate-900/40 hover:border-blue-500/50 cursor-pointer' 
                                          : 'bg-zinc-950/10 border-dashed border-slate-850 hover:bg-zinc-950/40 hover:border-emerald-500/40 cursor-pointer'
                                      }`}
                                      onClick={() => {
                                        if (resident) {
                                          setEditingTenant(resident);
                                          setIsEditTenantModalOpen(true);
                                          playCyberBlip();
                                        } else {
                                          setAllotBedInitialRoom(room.roomNumber);
                                          setAllotBedInitialBed(currentBedName);
                                          setIsAllotBedModalOpen(true);
                                          playCyberBlip();
                                        }
                                      }}
                                      title={resident ? `Click to inspect or edit ${resident.name}` : `Click to Allot ${currentBedName} in Room ${room.roomNumber}`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${
                                          resident 
                                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                                            : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/20'
                                        }`}>
                                          <Bed className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0 flex items-center gap-2">
                                          <span className="text-[9px] uppercase font-mono font-extrabold text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded shrink-0">
                                            {currentBedName.replace('Bed ', '')}
                                          </span>
                                          <div className="min-w-0">
                                            {resident ? (
                                              <>
                                                <span className="text-xs font-black text-slate-100 truncate block font-sans">
                                                  {resident.name}
                                                </span>
                                                <span className="text-[9px] text-[#f6aa8e] block font-mono">
                                                  UID: {resident.tenantId} • Rent Paid
                                                </span>
                                              </>
                                            ) : (
                                              <span className="text-xs font-bold text-slate-500 italic block font-sans">
                                                Open Bed Space
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {resident ? (
                                        <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-950/30 border border-blue-900/30 px-2 py-0.5 rounded-md hover:bg-blue-600 hover:text-white transition-all scale-[0.9] origin-right select-none">
                                          Inspect
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-black uppercase text-emerald-450 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-md scale-[0.9] origin-right select-none hover:bg-emerald-600 hover:text-white transition-all cursor-pointer font-bold">
                                          Allot
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Room Status Badge bottom alignment */}
                            <div className="mt-4 pt-3 border-t border-slate-900 bg-zinc-950/10 -mx-5 -mb-5 p-3 flex justify-between items-center text-[10px] font-sans">
                              {room.vacant === 0 ? (
                                <span className="text-rose-400 font-extrabold flex items-center gap-1 font-mono uppercase bg-rose-950/40 border border-rose-900/30 px-2 py-0.5 rounded">
                                  🔒 Fully Occupied
                                </span>
                              ) : room.occupied === 0 ? (
                                <span className="text-slate-400 font-medium flex items-center gap-1 uppercase bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                                  💤 Entire Room Vacant
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-extrabold flex items-center gap-1 font-mono uppercase bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded shrink-0">
                                  🟢 {room.vacant} Vacancies Left
                                </span>
                              )}
                              
                              <span className="text-slate-400 font-mono text-[9px]">
                                {room.type === 'Single' ? '$15,000/mo' : room.type === 'Double' ? '$11,000/mo' : '$8,500/mo'}
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })()}

              {/* View 8: RENT MANAGEMENT PORTAL */}
              {managerView === 'rent' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Stats Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-[#050612] border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">Rent Expected</span>
                      <div className="text-2xl font-black mt-2 font-mono text-white">
                        ₹{tenants.reduce((acc, t) => acc + (t.rentAmount || 11000), 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-[#050612] border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-[#10b981] block tracking-wider font-mono">Rent Received</span>
                      <div className="text-2xl font-black mt-2 font-mono text-[#10b981] text-glow-emerald">
                        ₹{rentPayments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-[#050612] border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-rose-450 block tracking-wider font-mono">Rent Pending</span>
                      <div className="text-2xl font-black mt-2 font-mono text-rose-400">
                        ₹{rentPayments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-[#050612] border border-slate-850 p-5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-blue-450 block tracking-wider font-mono">Collection Speed</span>
                      <div className="text-2xl font-black mt-2 font-mono text-blue-400">
                        {(() => {
                          const total = rentPayments.length;
                          const paid = rentPayments.filter(p => p.status === 'paid').length;
                          return total > 0 ? Math.round((paid / total) * 100) : 100;
                        })()}%
                      </div>
                    </div>
                  </div>

                  {/* Rent Split Tabs container card */}
                  <div className="bg-[#050612] border border-slate-850 rounded-2xl overflow-hidden shadow-xl p-6">
                    <div className="flex border-b border-slate-850 mb-6 font-sans">
                      <button
                        onClick={() => { setRentSubTab('dues'); playCyberBlip(); }}
                        className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                          rentSubTab === 'dues'
                            ? 'text-[#f05d24]'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Rent Dues (Pending)
                        {rentSubTab === 'dues' && (
                          <motion.div layoutId="rentUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f05d24]" />
                        )}
                      </button>
                      <button
                        onClick={() => { setRentSubTab('paid'); playCyberBlip(); }}
                        className={`pb-3 px-6 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${
                          rentSubTab === 'paid'
                            ? 'text-emerald-400'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Rent Paid (Cleared)
                        {rentSubTab === 'paid' && (
                          <motion.div layoutId="rentUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                        )}
                      </button>
                    </div>

                    {rentSubTab === 'dues' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                              <th className="py-3 px-4">Resident</th>
                              <th className="py-3 px-4">Room No.</th>
                              <th className="py-3 px-4">Amount Due</th>
                              <th className="py-3 px-4">Month</th>
                              <th className="py-3 px-4">Direct Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {rentPayments.filter(p => p.status === 'pending').length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-[11px] uppercase">
                                  🎉 Awesome! All residents cleared their rent for this month!
                                </td>
                              </tr>
                            ) : (
                              rentPayments.filter(p => p.status === 'pending').map((p) => (
                                <tr key={p.id} className="hover:bg-slate-950/40">
                                  <td className="py-3 px-4 font-bold text-white">{p.tenantName}</td>
                                  <td className="py-3 px-4 text-slate-350 font-mono">{p.roomNumber}</td>
                                  <td className="py-3 px-4 text-[#f05d24] font-black font-mono">₹{p.amount.toLocaleString('en-IN')}</td>
                                  <td className="py-3 px-4 text-slate-400">{p.month}</td>
                                  <td className="py-3 px-4">
                                    <button
                                      type="button"
                                      onClick={() => handleMarkRentAsPaid(p.id)}
                                      className="py-1 px-3 bg-[#10b981]/15 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/20 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      Mark as Paid
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                              <th className="py-3 px-4">Resident</th>
                              <th className="py-3 px-4">Room No.</th>
                              <th className="py-3 px-4">Amount Paid</th>
                              <th className="py-3 px-4">Month</th>
                              <th className="py-3 px-4">Transaction Clearance Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {rentPayments.filter(p => p.status === 'paid').length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-[11px] uppercase">
                                  Nil collections recorded yet for this month.
                                </td>
                              </tr>
                            ) : (
                              rentPayments.filter(p => p.status === 'paid').map((p) => (
                                <tr key={p.id} className="hover:bg-slate-950/40">
                                  <td className="py-3 px-4 font-bold text-slate-205">{p.tenantName}</td>
                                  <td className="py-3 px-4 text-slate-400 font-mono">{p.roomNumber}</td>
                                  <td className="py-3 px-4 text-[#10b981] font-black font-mono">₹{p.amount.toLocaleString('en-IN')}</td>
                                  <td className="py-3 px-4 text-slate-450">{p.month}</td>
                                  <td className="py-3 px-4 text-slate-400 font-mono">
                                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString() + ' ' + new Date(p.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* View 9: PAYROLL MANAGEMENT PORTAL */}
              {managerView === 'payroll' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Record Form Side Pane */}
                    <div className="bg-[#050612] border border-slate-850 p-6 rounded-2xl shadow-xl space-y-4">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-[#f05d24]/10 border border-[#f05d24]/30 text-[#f05d24] text-[10px] font-black uppercase tracking-wider font-mono">
                          Director Accounting Console
                        </span>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider mt-2">Disburse Employee Salary</h3>
                        <p className="text-[11px] text-slate-500 leading-normal mt-1">
                          Secure entry portal for recording monthly salaries paid to site personnel.
                        </p>
                      </div>

                      <div className="space-y-3.5 pt-2">
                        {/* Emp Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff Name</label>
                          <select
                            value={salName}
                            onChange={(e) => handleEmployeeNameChange(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                          >
                            <option value="Amit Kumar">Amit Kumar</option>
                            <option value="Saraswati Devi">Saraswati Devi</option>
                            <option value="Vikram Malhotra">Vikram Malhotra</option>
                            <option value="Rajesh Patel">Rajesh Patel</option>
                          </select>
                        </div>

                        {/* Emp Role */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role Designation</label>
                          <input
                            type="text"
                            value={salRole}
                            disabled
                            className="w-full bg-slate-900 border border-slate-850 text-slate-400 rounded-xl px-3 py-2 text-xs outline-none cursor-not-allowed"
                          />
                        </div>

                        {/* Amount */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid (₹)</label>
                          <input
                            type="number"
                            value={salAmount}
                            onChange={(e) => setSalAmount(e.target.value)}
                            placeholder="e.g. 18000"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 rounded-xl px-3 py-2 text-xs underline-none outline-none"
                          />
                        </div>

                        {/* Month */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Month</label>
                          <select
                            value={salMonth}
                            onChange={(e) => setSalMonth(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                          >
                            <option value="June 2026">June 2026</option>
                            <option value="May 2026">May 2026</option>
                            <option value="April 2026">April 2026</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!salAmount) {
                              addToast("Warning", "Please enter a valid amount.", "warning");
                              return;
                            }
                            handleRecordSalary({
                              employeeName: salName,
                              role: salRole,
                              amountPaid: Number(salAmount),
                              month: salMonth,
                              status: 'Paid'
                            });
                          }}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center md:text-sm font-sans"
                        >
                          Record Payment Clearance
                        </button>
                      </div>
                    </div>

                    {/* Payroll History Log */}
                    <div className="lg:col-span-2 bg-[#050612] border border-slate-850 p-6 rounded-2xl shadow-xl">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Payroll Disbursement Ledger</h3>
                        <p className="text-[11px] text-slate-500 leading-normal mt-1">
                          Auditable real-time list of historical salary allocations.
                        </p>
                      </div>

                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full text-left font-sans text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                              <th className="py-3 px-4">Employee</th>
                              <th className="py-3 px-4">Role Designation</th>
                              <th className="py-3 px-4">Month</th>
                              <th className="py-3 px-5">Amount Disbursed</th>
                              <th className="py-3 px-4">Clearance Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900">
                            {salaries.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-[11px] uppercase">
                                  No disbursements recorded in the system.
                                </td>
                              </tr>
                            ) : (
                              salaries.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-950/40">
                                  <td className="py-3 px-4 font-bold text-white">{s.employeeName}</td>
                                  <td className="py-3 px-4 text-slate-350">{s.role}</td>
                                  <td className="py-3 px-4 text-slate-400 font-mono">{s.month}</td>
                                  <td className="py-3 px-5 text-emerald-400 font-black font-mono">₹{s.amountPaid.toLocaleString('en-IN')}</td>
                                  <td className="py-3 px-4">
                                    <span className="px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 font-bold uppercase text-[9px] font-sans">
                                      {s.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* GOOGLE WORKSPACE UTILITIES SYSTEM */}
              <WorkspaceCenter userRole="manager" userEmail={sessionUser.info.email} />

            </motion.div>
          )}

          {/* ==================================== */}
          {/* 3.5 EMPLOYEE DASHBOARD SYSTEM */}
          {/* ==================================== */}
          {sessionUser && sessionUser.role === 'employee' && (
            <motion.div
              key="employee-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-6 my-4 font-sans"
            >
              {/* Header block */}
              <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-zinc-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-blue-500/5 to-transparent rounded-full -mr-20 -mt-20"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider font-mono">
                        Zora Staff Terminal Connected
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase mt-2 font-mono">
                      Welcome Back, {sessionUser.info.name}!
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Assigned Role: <span className="text-orange-500 font-bold">{sessionUser.info.role}</span> • Session Status: Secure
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSessionUser(null);
                      playSuccessTone();
                      addToast("Signed Out", "Staff session closed successfully.", "info");
                    }}
                    className="py-2 px-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-805 text-zinc-350 hover:text-white rounded-lg text-xs font-bold uppercase font-mono tracking-wider transition-all cursor-pointer"
                  >
                    Close Session
                  </button>
                </div>
              </div>

              {/* Grid content: Left Column (My Salary) & Right Column (My Tasks/Tickets) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. My Salary History section */}
                <div className="lg:col-span-4 bg-[#050612] border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">My Salary Ledger</h3>
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Historical overview of salary disbursements cleared to your registered profile.
                    </p>

                    <div className="space-y-3 mt-6">
                      {salaries.filter(s => s.employeeName === sessionUser.info.name).length === 0 ? (
                        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl text-center">
                          <span className="text-[11px] text-slate-500 font-mono uppercase block">Nil payments on ledger</span>
                          <span className="text-[10px] text-slate-600 font-light mt-1 block">Your recorded monthly salary transactions will display here.</span>
                        </div>
                      ) : (
                        salaries
                          .filter(s => s.employeeName === sessionUser.info.name)
                          .map((s) => (
                            <div key={s.id} className="bg-slate-950/80 border border-slate-900/60 rounded-xl p-3.5 flex justify-between items-center hover:border-slate-800 transition-all">
                              <div>
                                <span className="text-xs font-bold text-white block">{s.month}</span>
                                <span className="text-[9px] text-slate-500 font-mono block uppercase mt-0.5">Recorded: {new Date(s.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-black text-emerald-400 font-mono block">₹{s.amountPaid.toLocaleString('en-IN')}</span>
                                <span className="inline-block px-1.5 py-0.5 bg-emerald-950/30 border border-emerald-900/40 text-[#10b981] font-bold uppercase text-[8px] rounded mt-1 font-mono">
                                  {s.status}
                                </span>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-905">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Total Paid (YTD)</span>
                      <span className="text-base font-black text-white font-mono">
                        ₹{salaries
                          .filter(s => s.employeeName === sessionUser.info.name)
                          .reduce((acc, s) => acc + s.amountPaid, 0)
                          .toLocaleString('en-IN')
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. My Tasks & Tickets section */}
                <div className="lg:col-span-8 bg-[#050612] border border-slate-850 p-6 rounded-2xl shadow-xl">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">My Dispatched Tasks</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Incidents routed directly to your dispatcher from Core Operations.
                    </p>
                  </div>

                  <div className="mt-6 space-y-4">
                    {tickets.filter(t => t.assignedTo === sessionUser.info.name).length === 0 ? (
                      <div className="py-12 border border-dashed border-slate-900 rounded-xl text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-bounce" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wide">All Clear! No Pending Tickets</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
                          You are currently caught up with all assigned PG maintenance tasks. Excellent work!
                        </p>
                      </div>
                    ) : (
                      tickets
                        .filter(t => t.assignedTo === sessionUser.info.name)
                        .map((t) => {
                          const isHigh = t.priority === 'emergency' || t.priority === 'urgent';
                          return (
                            <div key={t.id} className="bg-slate-950/80 border border-slate-900/40 hover:border-slate-800 rounded-xl p-5 relative overflow-hidden transition-all">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-extrabold text-blue-400 font-mono uppercase bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded">
                                      Room {t.roomNumber}
                                    </span>
                                    <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                                      isHigh 
                                        ? 'bg-rose-950/40 border border-rose-900/30 text-rose-400' 
                                        : 'bg-slate-900 border border-slate-850 text-slate-400'
                                    }`}>
                                      {t.priority.toUpperCase()}
                                    </span>
                                    <span className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${
                                      t.status === 'resolved' 
                                        ? 'bg-emerald-950/45 border border-emerald-950/40 text-[#10b981]' 
                                        : t.status === 'inprogress' || t.status === 'in-progress'
                                          ? 'bg-amber-955/45 border border-amber-900/40 text-amber-450'
                                          : 'bg-zinc-950 border border-zinc-850 text-slate-400'
                                    }`}>
                                      {t.status.toUpperCase()}
                                    </span>
                                  </div>

                                  <h4 className="text-base font-extrabold text-white tracking-wide leading-tight pt-1">
                                    {t.title}
                                  </h4>
                                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                                    {t.description}
                                  </p>

                                  <span className="text-[9px] text-[#f6aa8e] block font-mono uppercase tracking-wider pt-1">
                                    Created on: {new Date(t.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                {/* Direct updates section */}
                                <div className="flex flex-col gap-1.5 shrink-0">
                                  {t.status !== 'resolved' && (
                                    <>
                                      {(t.status === 'pending' || t.status === 'new') && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateTicketStatus(t.id, 'in-progress');
                                            playCyberBlip();
                                          }}
                                          className="py-1 px-3 bg-amber-650 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center cursor-pointer select-none"
                                        >
                                          Start Work
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleUpdateTicketStatus(t.id, 'resolved', 'Staff verified incident solved at room endpoint.');
                                          playCyberBlip();
                                        }}
                                        className="py-1 px-3 bg-emerald-600 hover:bg-emerald-550 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all text-center cursor-pointer select-none"
                                      >
                                        Mark Resolved
                                      </button>
                                    </>
                                  )}
                                  {t.status === 'resolved' && (
                                    <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1 select-none">
                                      ✓ Solved
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

              </div>

              {/* GOOGLE WORKSPACE UTILITIES SYSTEM FOR EMPLOYEE */}
              <WorkspaceCenter userRole="employee" userEmail={sessionUser.info.email} />

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER ACCENTS */}
      <footer className="py-8 px-6 text-center border-t border-[#E5DCD3] mt-12 bg-white/40 text-[10px] text-[#7C5E50] font-mono tracking-widest uppercase">
        <p>© 2026 ZORA STAYS • EXCLUSIVE SMART PG LIVING ECOSYSTEM FOR HER</p>
      </footer>

      {/* ==================================== */}
      {/* 4. MODALS & SUB-LAYERS */}
      {/* ==================================== */}
      
      {/* In-App Glowing Alert Toasts Layer */}
      <NotificationBanner toasts={toasts} onDismiss={handleDismissToast} />

      {/* Modal: Raise Ticket Wizard */}
      <RaiseTicketModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onSubmit={handleRaiseTicket}
      />

      {/* Onboarding Wizard Modal for Tenants */}
      {sessionUser && sessionUser.role === 'tenant' && (
        <TenantOnboardingWizard
          isOpen={isOnboardingModalOpen}
          tenant={sessionUser.info}
          onClose={() => setIsOnboardingModalOpen(false)}
          onComplete={handleCompleteOnboarding}
        />
      )}

      {/* Modal: Raise Lost/Found Post */}
      <RaiseLostFoundModal
        isOpen={isLostFoundModalOpen}
        onClose={() => setIsLostFoundModalOpen(false)}
        onSubmit={handleCreateLostFoundItem}
      />

      {/* Modal: Add Tenant Roster Enrollment */}
      <AddTenantModal
        isOpen={isAddTenantModalOpen}
        onClose={() => setIsAddTenantModalOpen(false)}
        onAddTenant={handleEnrollTenant}
        onBatchUpload={handleBulkEnrollTenants}
      />

      {/* Modal: Add Room Unit */}
      <AddRoomModal
        isOpen={isAddRoomModalOpen}
        onClose={() => setIsAddRoomModalOpen(false)}
        onAddRoom={handleSaveRoom}
        existingRooms={ROOM_DATABASE}
      />

      {/* Modal: Edit Tenant Details */}
      <EditTenantModal
        isOpen={isEditTenantModalOpen}
        tenant={editingTenant ? (tenants.find(t => t.tenantId === editingTenant.tenantId) || editingTenant) : null}
        onClose={() => {
          setIsEditTenantModalOpen(false);
          setEditingTenant(null);
        }}
        onSaveTenant={handleSaveTenant}
        currentUserRole={sessionUser ? sessionUser.role : 'tenant'}
      />

      {/* Modal: Delete Tenant Confirmation */}
      <DeleteTenantModal
        isOpen={tenantIdToDelete !== null}
        tenant={tenants.find(t => t.tenantId === tenantIdToDelete) || null}
        onClose={() => setTenantIdToDelete(null)}
        onConfirm={handleDeleteTenant}
      />

      {/* Modal: Allot/Reassign Guest Bed */}
      <AllotBedModal
        isOpen={isAllotBedModalOpen}
        onClose={() => {
          setIsAllotBedModalOpen(false);
          setAllotBedInitialRoom('');
          setAllotBedInitialBed('');
        }}
        tenants={tenants}
        onAllot={handleAllotBed}
        initialRoomNumber={allotBedInitialRoom}
        initialBedNumber={allotBedInitialBed}
        roomDatabase={ROOM_DATABASE}
      />

      {/* Modal: Ticket Chronology Inspector and Action Room */}
      <TicketDetailModal
        isOpen={selectedTicket !== null}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        currentUserRole={sessionUser ? sessionUser.role : 'tenant'}
        currentUserName={sessionUser ? (sessionUser.role === 'manager' ? 'Support Management' : sessionUser.info.name) : ''}
        onAddComment={handleAddComment}
        onUpdateStatus={handleUpdateTicketStatus}
        onFollowup={handleFollowupTicket}
        onFastResolve={handleFastResolve}
        onAssignTask={handleAssignTicket}
      />

      {/* ==================================== */}
      {/* SESSION SECURITY AUDITOR & REVOCATION MODAL */}
      {/* ==================================== */}
      <AnimatePresence>
        {isSessionModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSessionModalOpen(false)}
              className="fixed inset-0 bg-[#0E0B0A] backdrop-blur-sm"
            />

            {/* Modal Body */}
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white w-full max-w-lg rounded-2xl border border-[#E5DCD3] shadow-2xl p-6 overflow-hidden z-10"
              >
                {/* Visual Header */}
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-250">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#4E2817] uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                        Security Session Manager
                        <span className="text-[9px] font-mono select-none px-1.5 py-0.5 rounded bg-emerald-500 text-white leading-none font-bold">LATEST BUILD</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                        Remote Handshake Audit • v_2026_06_03_1632
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSessionModalOpen(false)}
                    className="p-1.5 rounded bg-[#FAF6F0] border border-[#E5DCD3] text-slate-550 hover:text-[#F15A24] cursor-pointer transition-colors"
                  >
                    <span className="text-[10px] font-bold font-mono px-1">ESC</span>
                  </button>
                </div>

                {/* Main Security Notice */}
                <div className="bg-[#FAF6F0] border border-[#E5DCD3] rounded-xl p-4 mb-5 text-xs text-[#4E2817]/95">
                  <div className="flex gap-2.5 items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold uppercase text-[10px] text-amber-600 tracking-wider">Active Threat Defense</p>
                      <p className="mt-1 leading-relaxed">
                        To maintain secure isolation and prevent unauthorized entries, Zora Stays tracks current active logins across your devices. You may check handshakes and revoke any other connection instantly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-3 max-h-[280px] overflow-y-auto mb-6 pr-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                    Authorized Handshakes ({activeSessions.filter(s => s.status === 'active').length})
                  </p>

                  {activeSessions.filter(s => s.status === 'active').map((session) => {
                    const isSelf = session.id === currentSessionId;
                    return (
                      <div
                        key={session.id}
                        className={`p-3.5 rounded-xl border ${
                          isSelf
                            ? 'bg-emerald-50/45 border-emerald-250'
                            : 'bg-white border-[#E5DCD3]'
                        } flex items-center justify-between gap-3 transition-colors relative overflow-hidden`}
                      >
                        {isSelf && (
                          <div className="absolute top-0 right-0 py-0.5 px-2 bg-emerald-500 text-[8px] font-mono font-black text-white rounded-bl tracking-widest uppercase">
                            This Device
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            isSelf ? 'bg-emerald-50 border border-emerald-200 text-emerald-600' : 'bg-slate-50 border border-slate-200 text-slate-500'
                          }`}>
                            {session.userAgent.toLowerCase().includes('mobile') || session.userAgent.toLowerCase().includes('smartphone') ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Monitor className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-bold text-[#4E2817] leading-tight">
                                {session.userAgent}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 px-1 py-0.5 rounded leading-none">
                                {session.role.toUpperCase()}
                              </span>
                              {session.buildVersion && (
                                <span className={`text-[9px] font-mono px-1 py-0.5 rounded leading-none ${
                                  session.buildVersion === 'v_2026_06_03_1632'
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-150 font-bold'
                                    : 'text-amber-700 bg-amber-50 border border-amber-150 font-medium'
                                }`}>
                                  {session.buildVersion}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-400 font-mono">
                                Active: {new Date(session.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                              </span>
                            </div>
                          </div>
                        </div>

                        {!isSelf && (
                          <button
                            onClick={async () => {
                              try {
                                await dbService.saveSession({
                                  ...session,
                                  status: 'revoked'
                                });
                                addToast("Session Discarded", "Remote handshake was successfully terminated.", "success");
                                playSuccessTone();
                              } catch {
                                addToast("Audit Failure", "Unable to alter remote connection state.", "error");
                                playBuzzer();
                              }
                            }}
                            className="p-1.5 rounded-lg border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 transition-all cursor-pointer font-mono text-[10px]"
                            title="Disconnect this single device"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Controls / Kill All Secondary Option */}
                <div className="flex gap-3 justify-end border-t border-[#E5DCD3] pt-4">
                  <button
                    onClick={() => setIsSessionModalOpen(false)}
                    className="py-2 px-4 rounded-xl bg-zinc-100 border border-zinc-200 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Close Panel
                  </button>
                  
                  {activeSessions.filter(s => s.id !== currentSessionId && s.status === 'active').length > 0 && (
                    <button
                      onClick={async () => {
                        try {
                          const userId = sessionUser?.role === 'tenant' ? sessionUser.info.tenantId : sessionUser?.info.email;
                          if (userId) {
                            await dbService.killAllOtherSessions(userId, currentSessionId);
                            addToast("Workspace Safeguarded", "All other active device channels discarded.", "success");
                            playSuccessTone();
                          }
                        } catch {
                          addToast("Handshake Error", "Could not complete batch revoke.", "error");
                          playBuzzer();
                        }
                      }}
                      className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Kill All Other Devices
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Virtual PG Security & Operations Companion */}
      <ZiaChatbot 
        tickets={tickets} 
        sessionUser={sessionUser} 
        onEscalate={handleEscalateToDirector} 
      />
      
      {/* Vercel Speed Insights */}
      <SpeedInsights />
    </div>
  );
}
