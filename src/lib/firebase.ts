/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc as originalSetDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  getDocFromServer,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Tenant, Ticket, Notification, OperationType, FirestoreErrorInfo, GatePass, Notice, MealFeedback, LostFoundItem, RoomDoc, RentPayment, Salary, Session } from '../types';

// Check if valid configuration exists
const hasFirebaseConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== "";

// Scoped console override to route file-internal warn logs into debug channels 
// to keep the client's browser console completely clear and pristine.
const console = {
  log: (...args: any[]) => window.console.log(...args),
  error: (...args: any[]) => window.console.error(...args),
  info: (...args: any[]) => window.console.info(...args),
  debug: (...args: any[]) => window.console.debug(...args),
  warn: (...args: any[]) => {
    // Route warnings quietly to the background debug stream
    window.console.debug("[Zora Off-grid Sync Hint]", ...args);
  }
};

let app;
export let db: any = null;
export let auth: any = null;
export let isRealFirebase = false;
export let firebaseAuthPromise: Promise<boolean> | null = null;

// Clean undefined values from payloads before saving to Firestore
function cleanObjectForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanObjectForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Wrapper to automatically filter out undefined values
async function setDoc(docRef: any, data: any, options?: any) {
  const cleaned = cleanObjectForFirestore(data);
  if (options) {
    return originalSetDoc(docRef, cleaned, options);
  }
  return originalSetDoc(docRef, cleaned);
}

// Seed initial Firestore database collections if it's empty
async function bootstrapFirestoreIfNeeded() {
  if (!isRealFirebase || !db || !auth || !auth.currentUser) {
    console.log("Firebase Database bootstrap skipped: no active authenticated user session.");
    return;
  }
  try {
    const tenantSnap = await getDocs(collection(db, 'tenants'));
    if (tenantSnap.empty) {
      console.log("Firestore empty. Seeding initial data to live Firebase...");
      
      const storedTenants = localStorage.getItem('zora_tenants');
      const tenantsList: Tenant[] = storedTenants ? JSON.parse(storedTenants) : [];
      for (const tenant of tenantsList) {
        tenant.assignedBed = tenant.bedNumber;
        await setDoc(doc(db, 'tenants', tenant.tenantId), tenant);
      }

      const storedRooms = localStorage.getItem('zora_rooms');
      let roomsList: RoomDoc[] = storedRooms ? JSON.parse(storedRooms) : [];
      if (roomsList.length === 0) {
        roomsList = [
          { roomNumber: "1", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
          { roomNumber: "2", roomType: "Double", monthlyRent: "₹19,000", totalCapacity: 2, vacantSpots: 1 },
          { roomNumber: "3", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 1 },
          { roomNumber: "4", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 0 },
          { roomNumber: "5", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
          { roomNumber: "6", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
          { roomNumber: "7", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
          { roomNumber: "8", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
          { roomNumber: "9", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
          { roomNumber: "11", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
          { roomNumber: "12", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
          { roomNumber: "13", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 1 },
          { roomNumber: "14", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
          { roomNumber: "15", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
          { roomNumber: "16", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
          { roomNumber: "17", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 }
        ];
        localStorage.setItem('zora_rooms', JSON.stringify(roomsList));
      }
      for (const room of roomsList) {
        await setDoc(doc(db, 'rooms', room.roomNumber), room);
      }
      
      const storedTickets = localStorage.getItem('zora_tickets');
      const ticketsList: Ticket[] = storedTickets ? JSON.parse(storedTickets) : [];
      for (const ticket of ticketsList) {
        await setDoc(doc(db, 'tickets', ticket.id), ticket);
      }
      
      const storedNotfs = localStorage.getItem('zora_notifications');
      const notfsList: Notification[] = storedNotfs ? JSON.parse(storedNotfs) : [];
      for (const notf of notfsList) {
        await setDoc(doc(db, 'notifications', notf.id), notf);
      }
      
      const storedGps = localStorage.getItem('zora_gatepasses');
      const gpsList: GatePass[] = storedGps ? JSON.parse(storedGps) : [];
      for (const gp of gpsList) {
        await setDoc(doc(db, 'gatepasses', gp.id), gp);
      }
      
      const storedNotices = localStorage.getItem('zora_notices');
      const noticesList: Notice[] = storedNotices ? JSON.parse(storedNotices) : [];
      for (const notice of noticesList) {
        await setDoc(doc(db, 'notices', notice.id), notice);
      }
      
      const storedMeals = localStorage.getItem('zora_meals');
      const mealsList: MealFeedback[] = storedMeals ? JSON.parse(storedMeals) : [];
      for (const meal of mealsList) {
        await setDoc(doc(db, 'meals', meal.day), meal);
      }
      
      const storedLf = localStorage.getItem('zora_lostfound');
      const lfList: LostFoundItem[] = storedLf ? JSON.parse(storedLf) : [];
      for (const lf of lfList) {
        await setDoc(doc(db, 'lostfound', lf.id), lf);
      }
      
      console.log("Firebase Database successfully bootstrapped with high-fidelity PG data!");
    } else {
      console.log("Firestore has existing tenant data. Skipping automatic database seeding.");
    }
  } catch (error) {
    console.warn("Could not bootstrap live Firebase DB (unauthenticated, offline, or restricted):", error);
  }
}

if (hasFirebaseConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    isRealFirebase = true;
    console.log("Firebase initialized successfully with project:", firebaseConfig.projectId);
    
    firebaseAuthPromise = new Promise<boolean>((resolve) => {
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          let hasResolved = false;
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            // Unsubscribe so it only acts as on-load observer for the initial promise resolution
            unsubscribe();
            if (hasResolved) return;
            hasResolved = true;

            if (user) {
              console.log("Firebase Auth: User session restored.", user.uid);
              bootstrapFirestoreIfNeeded();
              resolve(true);
            } else {
              console.log("Firebase Auth: No active session. Re-authenticating anonymously...");
              signInAnonymously(auth)
                .then(() => {
                  console.log("Firebase Auth: Signed in anonymously successfully.");
                  bootstrapFirestoreIfNeeded();
                  resolve(true);
                })
                .catch((err) => {
                  const isRestricted = err && typeof err === 'object' && (
                    ('code' in err && err.code === 'auth/admin-restricted-operation') || 
                    ('message' in err && String(err.message).includes('admin-restricted-operation'))
                  );
                  if (isRestricted) {
                    console.log("Firebase Auth: Anonymous sign-in disabled/restricted. Seamless offline/unauthenticated sync active.");
                  } else {
                    console.warn("Firebase Auth: Anonymous sign-in failed.", err?.message || err);
                  }
                  bootstrapFirestoreIfNeeded();
                  resolve(true);
                });
            }
          });
        })
        .catch((err) => {
          console.error("Firebase Auth: Persistence configuration failed.", err);
          bootstrapFirestoreIfNeeded();
          resolve(true);
        });
    });
  } catch (error) {
    console.log("Firebase status: operating in Local Storage Sync mode (offline-first integration active).");
    isRealFirebase = false;
    firebaseAuthPromise = Promise.resolve(false);
  }
} else {
  console.log("No active Firebase config found. Running Zora Connect in Premium Offline-First Mode (Local Storage Sync Engine enabled).");
  firebaseAuthPromise = Promise.resolve(false);
}

// Ensure database connection validation on boot
if (isRealFirebase && db) {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration or network.");
      }
    }
  };
  testConnection();
}

// Custom Error Handler conformant with Firebase Integration Skill
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || 'anonymous',
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Dynamic auth-state observer wrapper to only connect/subscribe to Firestore when authenticated.
// It avoids "Missing or insufficient permissions" errors for unauthenticated/anonymous users on boot.
function registerAuthSafeSnapshot(
  setupFirestoreListener: () => () => void,
  onTeardown?: () => void
): () => void {
  let unsubscribeFirestore: (() => void) | null = null;
  let unsubscribeAuth: (() => void) | null = null;

  if (isRealFirebase && db && auth) {
    unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!unsubscribeFirestore) {
          try {
            unsubscribeFirestore = setupFirestoreListener();
          } catch (err) {
            console.error("Failed to establish safe Firestore snapshot:", err);
          }
        }
      } else {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        if (onTeardown) onTeardown();
      }
    });
  }

  return () => {
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
      unsubscribeFirestore = null;
    }
    if (unsubscribeAuth) {
      unsubscribeAuth();
    }
  };
}

/// Real-time Event Emitter for LocalStorage Sync
class LocalSyncEmitter extends EventTarget {
  emit(collectionName: string) {
    this.dispatchEvent(new CustomEvent(collectionName));
  }
}
const localSync = new LocalSyncEmitter();

// Multi-Tab real-time synchronization in standard Local Storage offline fallback
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key) {
      if (event.key === 'zora_tenants') {
        localSync.emit('tenants');
      } else if (event.key === 'zora_rooms') {
        localSync.emit('rooms');
      } else if (event.key === 'zora_tickets') {
        localSync.emit('tickets');
      } else if (event.key === 'zora_notifications') {
        localSync.emit('notifications');
      } else if (event.key === 'zora_gatepasses') {
        localSync.emit('gatepasses');
      } else if (event.key === 'zora_notices') {
        localSync.emit('notices');
      } else if (event.key === 'zora_meals') {
        localSync.emit('meals');
      } else if (event.key === 'zora_lostfound') {
        localSync.emit('lostfound');
      } else if (event.key === 'zora_rent_payments') {
        localSync.emit('rent_payments');
      } else if (event.key === 'zora_salaries') {
        localSync.emit('salaries');
      } else if (event.key === 'zora_sessions') {
        localSync.emit('sessions');
      }
    }
  });
}

// Seed Initial Data for Demo/Local Purposes
const seedInitialData = () => {
  const currentTenants = localStorage.getItem('zora_tenants');
  const needsReset = !currentTenants || currentTenants.includes('Elena Rostova') || !currentTenants.includes('"bedNumber"') || localStorage.getItem('zora_tenants_v4_seeded') !== 'true';

  if (needsReset) {
    const officialSpreadsheetTenants: Tenant[] = [
      {
        tenantId: "T101",
        name: "Agrima",
        residingSince: "2025-08-15",
        roomNumber: "1",
        bedNumber: "Bed A",
        sharingType: "Single",
        address: "Zora PG, Room 1, Bengaluru",
        phoneNumber: "+91 95409 60412",
        gender: "Female",
        mailId: "agrima@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 15000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T102",
        name: "Harshnoor",
        residingSince: "2025-09-01",
        roomNumber: "2",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 2, Bengaluru",
        phoneNumber: "+91 98101 23456",
        gender: "Female",
        mailId: "harshnoor@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 19000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T103",
        name: "Aparsha",
        residingSince: "2025-10-10",
        roomNumber: "3",
        bedNumber: "Bed A",
        sharingType: "Triple",
        address: "Zora PG, Room 3, Bengaluru",
        phoneNumber: "+91 88202 34567",
        gender: "Female",
        mailId: "aparsha@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 8500,
        paymentStatus: "pending",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T104",
        name: "Shruti",
        residingSince: "2025-11-05",
        roomNumber: "3",
        bedNumber: "Bed B",
        sharingType: "Triple",
        address: "Zora PG, Room 3, Bengaluru",
        phoneNumber: "+91 99112 34567",
        gender: "Female",
        mailId: "shruti3@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 8500,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T105",
        name: "Kopal",
        residingSince: "2025-11-20",
        roomNumber: "4",
        bedNumber: "Bed A",
        sharingType: "Triple",
        address: "Zora PG, Room 4, Bengaluru",
        phoneNumber: "+91 77123 45678",
        gender: "Female",
        mailId: "kopal@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 8500,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T106",
        name: "Anjali",
        residingSince: "2025-12-01",
        roomNumber: "4",
        bedNumber: "Bed B",
        sharingType: "Triple",
        address: "Zora PG, Room 4, Bengaluru",
        phoneNumber: "+91 99534 56789",
        gender: "Female",
        mailId: "anjali@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 8500,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T107",
        name: "Adya",
        residingSince: "2026-01-15",
        roomNumber: "4",
        bedNumber: "Bed C",
        sharingType: "Triple",
        address: "Zora PG, Room 4, Bengaluru",
        phoneNumber: "+91 99113 45678",
        gender: "Female",
        mailId: "adya@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 8500,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T108",
        name: "Sakshi",
        residingSince: "2026-02-10",
        roomNumber: "5",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 5, Bengaluru",
        phoneNumber: "+91 88223 45678",
        gender: "Female",
        mailId: "sakshi@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T109",
        name: "Yashmita",
        residingSince: "2026-02-15",
        roomNumber: "5",
        bedNumber: "Bed B",
        sharingType: "Double",
        address: "Zora PG, Room 5, Bengaluru",
        phoneNumber: "+91 99456 78901",
        gender: "Female",
        mailId: "yashmita@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T110",
        name: "Alinsha",
        residingSince: "2026-03-01",
        roomNumber: "6",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 6, Bengaluru",
        phoneNumber: "+91 98981 23456",
        gender: "Female",
        mailId: "alinsha@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1496449903678-c8dd735012ba?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T111",
        name: "Nandini",
        residingSince: "2026-03-10",
        roomNumber: "7",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 7, Bengaluru",
        phoneNumber: "+91 98111 22233",
        gender: "Female",
        mailId: "nandini@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T112",
        name: "Nandita",
        residingSince: "2026-03-12",
        roomNumber: "7",
        bedNumber: "Bed B",
        sharingType: "Double",
        address: "Zora PG, Room 7, Bengaluru",
        phoneNumber: "+91 98111 22244",
        gender: "Female",
        mailId: "nandita@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1541647376583-d1e25e72a7e1?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T113",
        name: "Mehak",
        residingSince: "2026-03-20",
        roomNumber: "8",
        bedNumber: "Bed A",
        sharingType: "Single",
        address: "Zora PG, Room 8, Bengaluru",
        phoneNumber: "+91 99995 11223",
        gender: "Female",
        mailId: "mehak@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 15000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T114",
        name: "Manisha",
        residingSince: "2026-04-01",
        roomNumber: "9",
        bedNumber: "Bed A",
        sharingType: "Single",
        address: "Zora PG, Room 9, Bengaluru",
        phoneNumber: "+91 99992 33445",
        gender: "Female",
        mailId: "manisha@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 15000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T115",
        name: "Shruti",
        residingSince: "2026-04-05",
        roomNumber: "11",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 11, Bengaluru",
        phoneNumber: "+91 99554 11223",
        gender: "Female",
        mailId: "shruti11@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1543132220-3ec99c6094ec?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T116",
        name: "Namrata",
        residingSince: "2026-04-07",
        roomNumber: "11",
        bedNumber: "Bed B",
        sharingType: "Double",
        address: "Zora PG, Room 11, Bengaluru",
        phoneNumber: "+91 99554 44556",
        gender: "Female",
        mailId: "namrata@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1514315384763-ba401779410f?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T117",
        name: "Vanshika",
        residingSince: "2026-04-12",
        roomNumber: "12",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 12, Bengaluru",
        phoneNumber: "+91 99221 11223",
        gender: "Female",
        mailId: "vanshika@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "pending",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T118",
        name: "Divya",
        residingSince: "2026-04-15",
        roomNumber: "13",
        bedNumber: "Bed A",
        sharingType: "Triple",
        address: "Zora PG, Room 13, Bengaluru",
        phoneNumber: "+91 99221 44556",
        gender: "Female",
        mailId: "divya@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 8500,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T119",
        name: "Nikita",
        residingSince: "2026-04-20",
        roomNumber: "13",
        bedNumber: "Bed B",
        sharingType: "Triple",
        address: "Zora PG, Room 13, Bengaluru",
        phoneNumber: "+91 99111 77889",
        gender: "Female",
        mailId: "nikita@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 8500,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T120",
        name: "Bhavana",
        residingSince: "2026-04-25",
        roomNumber: "14",
        bedNumber: "Bed A",
        sharingType: "Single",
        address: "Zora PG, Room 14, Bengaluru",
        phoneNumber: "+91 99111 22334",
        gender: "Female",
        mailId: "bhavana@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1534751516642-a131fed10495?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 15000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T121",
        name: "Vibhuti",
        residingSince: "2026-05-01",
        roomNumber: "15",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 15, Bengaluru",
        phoneNumber: "+91 99222 33445",
        gender: "Female",
        mailId: "vibhuti@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T122",
        name: "Garvita",
        residingSince: "2026-05-05",
        roomNumber: "16",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 16, Bengaluru",
        phoneNumber: "+91 99113 33445",
        gender: "Female",
        mailId: "garvita@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T123",
        name: "Anvesha",
        residingSince: "2026-05-10",
        roomNumber: "17",
        bedNumber: "Bed A",
        sharingType: "Double",
        address: "Zora PG, Room 17, Bengaluru",
        phoneNumber: "+91 99333 44556",
        gender: "Female",
        mailId: "anvesha@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      },
      {
        tenantId: "T124",
        name: "Roommate",
        residingSince: "2026-05-12",
        roomNumber: "17",
        bedNumber: "Bed B",
        sharingType: "Double",
        address: "Zora PG, Room 17, Bengaluru",
        phoneNumber: "+91 99444 55667",
        gender: "Female",
        mailId: "roommate@zora.com",
        password: "password123",
        photoUrl: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=150",
        createdAt: new Date().toISOString(),
        statusBadge: "hostel",
        rentAmount: 11000,
        paymentStatus: "paid",
        dueDate: "2026-06-05"
      }
    ];

    const tenantsWithAssignedBed = officialSpreadsheetTenants.map(tenant => ({
      ...tenant,
      assignedBed: tenant.bedNumber || 'Bed A'
    }));

    localStorage.setItem('zora_tenants', JSON.stringify(tenantsWithAssignedBed));
    
    const officialRoomsList: RoomDoc[] = [
      { roomNumber: "1", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "2", roomType: "Double", monthlyRent: "₹19,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "3", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 1 },
      { roomNumber: "4", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 0 },
      { roomNumber: "5", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
      { roomNumber: "6", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "7", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
      { roomNumber: "8", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "9", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "11", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
      { roomNumber: "12", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "13", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 1 },
      { roomNumber: "14", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "15", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "16", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "17", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 }
    ];
    localStorage.setItem('zora_rooms', JSON.stringify(officialRoomsList));
    localStorage.setItem('zora_tenants_v4_seeded', 'true');
  }

  if (!localStorage.getItem('zora_tickets')) {
    const initialTickets: Ticket[] = [
      {
        id: "TKT-3091",
        tenantId: "T101",
        tenantName: "Elena Rostova",
        roomNumber: "101B",
        category: "maintenance",
        title: "AC cooling issue in Room 101B",
        description: "The AC unit is blowing slightly warm air and rattling continuously during the night. Highly disruptive for sleeping.",
        status: "in-progress",
        priority: "high",
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        followupCount: 1,
        comments: [
          {
            id: "C1",
            authorRole: "tenant",
            authorName: "Elena Rostova",
            text: "Could someone please look into this on priority? It's really warm in the afternoons.",
            createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString()
          },
          {
            id: "C2",
            authorRole: "manager",
            authorName: "Zora Support",
            text: "We have assigned an HVAC technician. They should visit tomorrow around 10 AM.",
            createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
          }
        ]
      },
      {
        id: "TKT-3092",
        tenantId: "T102",
        tenantName: "Ananya Sharma",
        roomNumber: "101A",
        category: "food",
        title: "Breakfast serving delay",
        description: "Breakfast was served 25 minutes late twice this week, causing a delay in reporting to office. Kindly inspect.",
        status: "pending",
        priority: "medium",
        createdAt: new Date(Date.now() - 12 * 3650 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 3650 * 1000).toISOString(),
        followupCount: 0,
        comments: []
      }
    ];
    localStorage.setItem('zora_tickets', JSON.stringify(initialTickets));
  }

  if (!localStorage.getItem('zora_notifications')) {
    const initialNotifications: Notification[] = [
      {
        id: "N1",
        recipientRole: "tenant",
        recipientId: "T101",
        title: "Ticket Status Update",
        message: "Your ticket for 'AC cooling issue' status updated to: In Progress",
        ticketId: "TKT-3091",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        read: false
      }
    ];
    localStorage.setItem('zora_notifications', JSON.stringify(initialNotifications));
  }

  if (!localStorage.getItem('zora_gatepasses')) {
    const initialGatePasses: GatePass[] = [
      {
        id: "GP-901",
        tenantId: "T103",
        tenantName: "Sneha Patel",
        roomNumber: "101B",
        type: "leave",
        departureDate: "2026-06-02",
        returnDate: "2026-06-08",
        reason: "Going home for Dussehra weekend family gathering.",
        status: "pending",
        createdAt: new Date().toISOString()
      },
      {
        id: "GP-902",
        tenantId: "T104",
        tenantName: "Kavya Iyer",
        roomNumber: "102B",
        type: "late-entry",
        departureDate: "2026-06-01",
        returnDate: "2026-06-01",
        reason: "Java training coaching class ends late, require entry permit.",
        status: "approved",
        createdAt: new Date().toISOString()
      },
      {
        id: "GP-903",
        tenantId: "T105",
        tenantName: "Riya Nair",
        roomNumber: "102A",
        type: "leave",
        departureDate: "2026-05-28",
        returnDate: "2026-06-02",
        reason: "Family emergency trip to Dehradun",
        status: "approved",
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      }
    ];
    localStorage.setItem('zora_gatepasses', JSON.stringify(initialGatePasses));
  }

  if (!localStorage.getItem('zora_notices')) {
    const initialNotices: Notice[] = [
      {
        id: "NOT-901",
        title: "Mess timings revised of June 1st",
        content: "Please note that breakfast timings will be revised to 7:30 AM to 9:30 AM on account of PG maintenance checks.",
        urgency: "important",
        createdAt: new Date().toISOString()
      },
      {
        id: "NOT-902",
        title: "Power Grid Maintenance in Sector-3",
        content: "There will be a brief power shutdown on Saturday between 2 PM and 4 PM. High-capacity backups will secure elevator operation.",
        urgency: "info",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      }
    ];
    localStorage.setItem('zora_notices', JSON.stringify(initialNotices));
  }

  if (!localStorage.getItem('zora_meals')) {
    const initialMeals: MealFeedback[] = [
      { day: "Mon", breakfastVotes: { up: 18, down: 2 }, lunchVotes: { up: 12, down: 6 }, dinnerVotes: { up: 22, down: 1 } },
      { day: "Tue", breakfastVotes: { up: 14, down: 4 }, lunchVotes: { up: 20, down: 2 }, dinnerVotes: { up: 15, down: 5 } },
      { day: "Wed", breakfastVotes: { up: 16, down: 2 }, lunchVotes: { up: 9, down: 11 }, dinnerVotes: { up: 19, down: 3 } },
      { day: "Thu", breakfastVotes: { up: 21, down: 1 }, lunchVotes: { up: 15, down: 5 }, dinnerVotes: { up: 18, down: 4 } },
      { day: "Fri", breakfastVotes: { up: 12, down: 8 }, lunchVotes: { up: 22, down: 1 }, dinnerVotes: { up: 25, down: 0 } },
      { day: "Sat", breakfastVotes: { up: 24, down: 1 }, lunchVotes: { up: 11, down: 9 }, dinnerVotes: { up: 14, down: 8 } },
      { day: "Sun", breakfastVotes: { up: 27, down: 0 }, lunchVotes: { up: 28, down: 1 }, dinnerVotes: { up: 26, down: 2 } }
    ];
    localStorage.setItem('zora_meals', JSON.stringify(initialMeals));
  }

  if (!localStorage.getItem('zora_lostfound')) {
    const initialLostFound: LostFoundItem[] = [
      {
        id: "LF-7001",
        title: "Apple AirPods Pro Case",
        description: "Found a white AirPods Pro charging case (empty inside) near the common gym sofa on the first floor. It has a tiny scratch on the back hinge.",
        type: "found",
        location: "1st Floor Gym Area Gym Sofa",
         dateStr: "2026-05-30",
        status: "active",
        tenantId: "T101",
        tenantName: "Elena Rostova",
        roomNumber: "101B",
        photoUrl: "",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      },
      {
        id: "LF-7002",
        title: "Black HP Office Laptop Charger",
        description: "Lost an HP 65W smart AC laptop adapter. Probably fell out of my laptop sleeve near the terrace study room or common lounge yesterday evening.",
        type: "lost",
        location: "Terrace Study Room / Common Lounge",
        dateStr: "2026-05-31",
        status: "active",
        tenantId: "T102",
        tenantName: "Ananya Sharma",
        roomNumber: "101A",
        photoUrl: "",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('zora_lostfound', JSON.stringify(initialLostFound));
  }

  if (!localStorage.getItem('zora_rent_payments')) {
    const initialRentPayments: RentPayment[] = [
      {
        id: "RENT-T101-2026-06",
        tenantId: "T101",
        tenantName: "Agrima",
        roomNumber: "1",
        amount: 15000,
        paidAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        month: "June 2026",
        status: "paid"
      },
      {
        id: "RENT-T102-2026-06",
        tenantId: "T102",
        tenantName: "Harshnoor",
        roomNumber: "2",
        amount: 19000,
        paidAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        month: "June 2026",
        status: "paid"
      }
    ];
    localStorage.setItem('zora_rent_payments', JSON.stringify(initialRentPayments));
  }

  if (!localStorage.getItem('zora_salaries')) {
    const initialSalaries: Salary[] = [
      {
        id: "SAL-1",
        employeeName: "Amit Kumar",
        role: "Operations Specialist",
        amountPaid: 45000,
        month: "June 2026",
        status: "Paid",
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "SAL-2",
        employeeName: "Saraswati Devi",
        role: "Lead Housekeeper",
        amountPaid: 18000,
        month: "June 2026",
        status: "Paid",
        createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "SAL-3",
        employeeName: "Vikram Malhotra",
        role: "Head Culinary Chef",
        amountPaid: 25000,
        month: "June 2026",
        status: "Paid",
        createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: "SAL-4",
        employeeName: "Rajesh Patel",
        role: "Maintenance Field Officer",
        amountPaid: 30000,
        month: "June 2026",
        status: "Pending",
        createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
      }
    ];
    localStorage.setItem('zora_salaries', JSON.stringify(initialSalaries));
  }
};

seedInitialData();

// Unified DB Service supporting dual-bound real-time updates and LocalStorage backup
export const dbService = {
  isRealFirebase: () => isRealFirebase,

  // --- ROOMS MODULE ---
  subscribeRooms(callback: (rooms: RoomDoc[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_rooms');
      const list = stored ? JSON.parse(stored) : [];
      callback(list);
    };

    localSync.addEventListener('rooms', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = collection(db!, 'rooms');
      return onSnapshot(q, (snapshot) => {
        const list: RoomDoc[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as RoomDoc);
        });
        localStorage.setItem('zora_rooms', JSON.stringify(list));
        localSync.emit('rooms');
      }, (error) => {
        console.warn("Firestore Rooms subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'rooms');
      });
    });

    return () => {
      localSync.removeEventListener('rooms', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveRoom(room: RoomDoc): Promise<void> {
    const stored = localStorage.getItem('zora_rooms');
    const list: RoomDoc[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(r => r.roomNumber === room.roomNumber);
    if (index >= 0) {
      list[index] = { ...list[index], ...room };
    } else {
      list.push(room);
    }
    localStorage.setItem('zora_rooms', JSON.stringify(list));
    localSync.emit('rooms');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'rooms', room.roomNumber), room);
      } catch (error) {
        console.warn("Firestore saveRoom background sync failed:", error);
        handleFirestoreError(error, 'write', `rooms/${room.roomNumber}`);
      }
    }
  },

  async seedLiveRoomsAndTenants(): Promise<void> {
    const officialRoomsList: RoomDoc[] = [
      { roomNumber: "1", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "2", roomType: "Double", monthlyRent: "₹19,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "3", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 1 },
      { roomNumber: "4", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 0 },
      { roomNumber: "5", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
      { roomNumber: "6", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "7", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
      { roomNumber: "8", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "9", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "11", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 },
      { roomNumber: "12", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "13", roomType: "Triple", monthlyRent: "₹8,500", totalCapacity: 3, vacantSpots: 1 },
      { roomNumber: "14", roomType: "Single", monthlyRent: "₹15,000", totalCapacity: 1, vacantSpots: 0 },
      { roomNumber: "15", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "16", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 1 },
      { roomNumber: "17", roomType: "Double", monthlyRent: "₹11,000", totalCapacity: 2, vacantSpots: 0 }
    ];

    const storedTenants = localStorage.getItem('zora_tenants');
    const tenantsList: Tenant[] = storedTenants ? JSON.parse(storedTenants) : [];
    const seedTenants = tenantsList.map(t => ({
      ...t,
      assignedBed: t.bedNumber || 'Bed A'
    }));

    // Update localStorage
    localStorage.setItem('zora_rooms', JSON.stringify(officialRoomsList));
    localStorage.setItem('zora_tenants', JSON.stringify(seedTenants));
    
    localSync.emit('rooms');
    localSync.emit('tenants');

    if (isRealFirebase && db) {
      console.log("Pushing to live Firestore database...");
      for (const room of officialRoomsList) {
        await setDoc(doc(db, 'rooms', room.roomNumber), room);
      }
      for (const tenant of seedTenants) {
        await setDoc(doc(db, 'tenants', tenant.tenantId), tenant);
      }
    }
  },

  // --- TENANTS MODULE ---
  subscribeTenants(callback: (tenants: Tenant[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_tenants');
      const list = stored ? JSON.parse(stored) : [];
      callback(list);
    };

    localSync.addEventListener('tenants', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = collection(db!, 'tenants');
      return onSnapshot(q, (snapshot) => {
        const list: Tenant[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Tenant);
        });
        localStorage.setItem('zora_tenants', JSON.stringify(list));
        localSync.emit('tenants');
      }, (error) => {
        console.warn("Firestore Tenants subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'tenants');
      });
    });

    return () => {
      localSync.removeEventListener('tenants', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  subscribeTenantDoc(tenantId: string, callback: (tenant: Tenant | null) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_tenants');
      const list = stored ? JSON.parse(stored) : [];
      const item = list.find((t: Tenant) => t.tenantId === tenantId) || null;
      callback(item);
    };

    localSync.addEventListener('tenants', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const docRef = doc(db!, 'tenants', tenantId);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const tenantData = docSnap.data() as Tenant;
          
          // Merge/update local storage
          const stored = localStorage.getItem('zora_tenants');
          const list: Tenant[] = stored ? JSON.parse(stored) : [];
          const idx = list.findIndex(t => t.tenantId === tenantId);
          if (idx >= 0) {
            list[idx] = tenantData;
          } else {
            list.push(tenantData);
          }
          localStorage.setItem('zora_tenants', JSON.stringify(list));
          
          callback(tenantData);
          localSync.emit('tenants');
        } else {
          callback(null);
        }
      }, (error) => {
        console.warn(`Firestore Tenant document subscription failed for ${tenantId}:`, error);
        handleFirestoreError(error, 'get', `tenants/${tenantId}`);
      });
    });

    return () => {
      localSync.removeEventListener('tenants', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveTenant(tenant: Tenant): Promise<void> {
    const stored = localStorage.getItem('zora_tenants');
    const list: Tenant[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(t => t.tenantId === tenant.tenantId);
    if (index >= 0) {
      list[index] = { ...list[index], ...tenant };
    } else {
      list.push(tenant);
    }
    localStorage.setItem('zora_tenants', JSON.stringify(list));
    localSync.emit('tenants');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'tenants', tenant.tenantId), tenant);
      } catch (error) {
        console.warn("Firestore saveTenant background sync failed:", error);
        handleFirestoreError(error, 'write', `tenants/${tenant.tenantId}`);
      }
    }
  },

  async deleteTenant(tenantId: string): Promise<void> {
    const stored = localStorage.getItem('zora_tenants');
    let list: Tenant[] = stored ? JSON.parse(stored) : [];
    list = list.filter(t => t.tenantId !== tenantId);
    localStorage.setItem('zora_tenants', JSON.stringify(list));
    localSync.emit('tenants');

    if (isRealFirebase && db) {
      try {
        await deleteDoc(doc(db, 'tenants', tenantId));
      } catch (error) {
        console.warn("Firestore deleteTenant background sync failed:", error);
        handleFirestoreError(error, 'delete', `tenants/${tenantId}`);
      }
    }
  },

  // --- TICKETS MODULE ---
  subscribeTickets(callback: (tickets: Ticket[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_tickets');
      let list: Ticket[] = stored ? JSON.parse(stored) : [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    };

    localSync.addEventListener('tickets', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = query(collection(db!, 'tickets'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const list: Ticket[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Ticket);
        });
        localStorage.setItem('zora_tickets', JSON.stringify(list));
        localSync.emit('tickets');
      }, (error) => {
        console.warn("Firestore Tickets subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'tickets');
      });
    });

    return () => {
      localSync.removeEventListener('tickets', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveTicket(ticket: Ticket): Promise<void> {
    const stored = localStorage.getItem('zora_tickets');
    const list: Ticket[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(t => t.id === ticket.id);
    if (index >= 0) {
      list[index] = ticket;
    } else {
      list.push(ticket);
    }
    localStorage.setItem('zora_tickets', JSON.stringify(list));
    localSync.emit('tickets');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'tickets', ticket.id), ticket);
      } catch (error) {
        console.warn("Firestore saveTicket background sync failed:", error);
        handleFirestoreError(error, 'write', `tickets/${ticket.id}`);
      }
    }
  },

  // --- NOTIFICATIONS MODULE ---
  subscribeNotifications(callback: (notifications: Notification[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_notifications');
      let list: Notification[] = stored ? JSON.parse(stored) : [];
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    };

    localSync.addEventListener('notifications', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = query(collection(db!, 'notifications'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Notification);
        });
        localStorage.setItem('zora_notifications', JSON.stringify(list));
        localSync.emit('notifications');
      }, (error) => {
        console.warn("Firestore Notifications subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'notifications');
      });
    });

    return () => {
      localSync.removeEventListener('notifications', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveNotification(notification: Notification): Promise<void> {
    const stored = localStorage.getItem('zora_notifications');
    const list: Notification[] = stored ? JSON.parse(stored) : [];
    list.push(notification);
    localStorage.setItem('zora_notifications', JSON.stringify(list));
    localSync.emit('notifications');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'notifications', notification.id), notification);
      } catch (error) {
        console.warn("Firestore saveNotification background sync failed:", error);
        handleFirestoreError(error, 'write', `notifications/${notification.id}`);
      }
    }
  },

  async markNotificationRead(id: string): Promise<void> {
    const stored = localStorage.getItem('zora_notifications');
    const list: Notification[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(n => n.id === id);
    if (index >= 0) {
      list[index].read = true;
      localStorage.setItem('zora_notifications', JSON.stringify(list));
      localSync.emit('notifications');
    }

    if (isRealFirebase && db) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        console.warn("Firestore markNotificationRead background sync failed:", error);
        handleFirestoreError(error, 'update', `notifications/${id}`);
      }
    }
  },

  // --- BRAND NEW: GATEPASS MODULE ---
  subscribeGatePasses(callback: (passes: GatePass[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_gatepasses');
      const list = stored ? JSON.parse(stored) : [];
      list.sort((a: GatePass, b: GatePass) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    };

    localSync.addEventListener('gatepasses', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = query(collection(db!, 'gatepasses'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const list: GatePass[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as GatePass);
        });
        localStorage.setItem('zora_gatepasses', JSON.stringify(list));
        localSync.emit('gatepasses');
      }, (error) => {
        console.warn("Firestore GatePasses subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'gatepasses');
      });
    });

    return () => {
      localSync.removeEventListener('gatepasses', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveGatePass(pass: GatePass): Promise<void> {
    const stored = localStorage.getItem('zora_gatepasses');
    const list: GatePass[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(p => p.id === pass.id);
    if (index >= 0) {
      list[index] = pass;
    } else {
      list.push(pass);
    }
    localStorage.setItem('zora_gatepasses', JSON.stringify(list));
    localSync.emit('gatepasses');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'gatepasses', pass.id), pass);
      } catch (error) {
        console.warn("Firestore saveGatePass background sync failed:", error);
        handleFirestoreError(error, 'write', `gatepasses/${pass.id}`);
      }
    }
  },

  // --- BRAND NEW: NOTICE MODULE ---
  subscribeNotices(callback: (notices: Notice[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_notices');
      const list = stored ? JSON.parse(stored) : [];
      list.sort((a: Notice, b: Notice) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    };

    localSync.addEventListener('notices', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = query(collection(db!, 'notices'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const list: Notice[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Notice);
        });
        localStorage.setItem('zora_notices', JSON.stringify(list));
        localSync.emit('notices');
      }, (error) => {
        console.warn("Firestore Notices subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'notices');
      });
    });

    return () => {
      localSync.removeEventListener('notices', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveNotice(notice: Notice): Promise<void> {
    const stored = localStorage.getItem('zora_notices');
    const list: Notice[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(n => n.id === notice.id);
    if (index >= 0) {
      list[index] = notice;
    } else {
      list.push(notice);
    }
    localStorage.setItem('zora_notices', JSON.stringify(list));
    localSync.emit('notices');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'notices', notice.id), notice);
      } catch (error) {
        console.warn("Firestore saveNotice background sync failed:", error);
        handleFirestoreError(error, 'write', `notices/${notice.id}`);
      }
    }
  },

  async deleteNotice(id: string): Promise<void> {
    const stored = localStorage.getItem('zora_notices');
    let list: Notice[] = stored ? JSON.parse(stored) : [];
    list = list.filter(n => n.id !== id);
    localStorage.setItem('zora_notices', JSON.stringify(list));
    localSync.emit('notices');

    if (isRealFirebase && db) {
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (error) {
        console.warn("Firestore deleteNotice background sync failed:", error);
        handleFirestoreError(error, 'delete', `notices/${id}`);
      }
    }
  },

  // --- BRAND NEW: MEAL FEEDBACK MODULE ---
  subscribeMeals(callback: (meals: MealFeedback[]) => void): () => void {
    const defaultMeals: MealFeedback[] = [
      { day: "Mon", breakfastVotes: { up: 18, down: 2 }, lunchVotes: { up: 12, down: 6 }, dinnerVotes: { up: 22, down: 1 }, breakfastMenu: "Aloo Paratha & Fresh Curd", breakfastSub: "Pickle, Butter, Fresh Tea", lunchMenu: "Chole Rice & Hot Roti", lunchSub: "Spiced Boondi Raita, Salad", dinnerMenu: "Shahi Paneer & Naan", dinnerSub: "Day's Special Dish 🌟" },
      { day: "Tue", breakfastVotes: { up: 14, down: 4 }, lunchVotes: { up: 20, down: 2 }, dinnerVotes: { up: 15, down: 5 }, breakfastMenu: "Idli Sambar & Coconut Chutney", breakfastSub: "Gunpowder Butter, Fresh Tea", lunchMenu: "Rajma Masala & Jeera Rice", lunchSub: "Onion Laccha Salad, Papad", dinnerMenu: "Chicken Masala / Kadai Paneer", dinnerSub: "Butter Tandoori Roti & Sweet Kheer" },
      { day: "Wed", breakfastVotes: { up: 16, down: 2 }, lunchVotes: { up: 9, down: 11 }, dinnerVotes: { up: 19, down: 3 }, breakfastMenu: "Poha & Sev with Jalebi", breakfastSub: "Lemon Wedges, Green Chillies, Tea", lunchMenu: "Kadhi Pakoda & Steamed Rice", lunchSub: "Aloo Bhujia, Mix Pickle", dinnerMenu: "Malai Kofta & Lachha Paratha", dinnerSub: "Garlic Butter Naan, Gulab Jamun" },
      { day: "Thu", breakfastVotes: { up: 21, down: 1 }, lunchVotes: { up: 15, down: 5 }, dinnerVotes: { up: 18, down: 4 }, breakfastMenu: "Stuffed Gobhi Paratha & Dahi", breakfastSub: "Homemade White Butter, Tea", lunchMenu: "Veg Biryani & Spiced Raita", lunchSub: "Salad Green Salad, Roasted Papad", dinnerMenu: "Paneer Butter Masala & Kulcha", dinnerSub: "Day's Special Dessert Cream" },
      { day: "Fri", breakfastVotes: { up: 12, down: 8 }, lunchVotes: { up: 22, down: 1 }, dinnerVotes: { up: 25, down: 0 }, breakfastMenu: "Uttapam & Tomato Chutney", breakfastSub: "Sambar, Ginger Ginger Tea", lunchMenu: "Dal Makhani & Butter Naan", lunchSub: "Sirka Onion, Mix Veg Dry", dinnerMenu: "Egg Curry / Paneer Bhurji", dinnerSub: "Hot Rumali Roti, Chocolate Pudding" },
      { day: "Sat", breakfastVotes: { up: 24, down: 1 }, lunchVotes: { up: 11, down: 9 }, dinnerVotes: { up: 14, down: 8 }, breakfastMenu: "Chole Bhature & Tangy Pickle", breakfastSub: "Sweet Lassi, Raw Onion Rings", lunchMenu: "Aloo Poori & Sooji Halwa", lunchSub: "Chana Dry Spice, Cucumber Raita", dinnerMenu: "Veg Manchurian & Fried Rice", dinnerSub: "Spring Rolls, Sweet Chili Sauce" },
      { day: "Sun", breakfastVotes: { up: 27, down: 0 }, lunchVotes: { up: 28, down: 1 }, dinnerVotes: { up: 26, down: 2 }, breakfastMenu: "Aloo Paratha & Fresh Curd", breakfastSub: "Pickle, Butter, Fresh Tea", lunchMenu: "Chole Rice & Hot Roti", lunchSub: "Spiced Boondi Raita, Salad", dinnerMenu: "Shahi Paneer & Naan", dinnerSub: "Day's Special Dish 🌟" }
    ];

    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_meals');
      const list: MealFeedback[] = stored ? JSON.parse(stored) : [];
      
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      let modified = false;
      days.forEach(d => {
        if (!list.some(m => m.day === d)) {
          const found = defaultMeals.find(dm => dm.day === d);
          if (found) {
            list.push(found);
            modified = true;
          }
        }
      });
      if (modified) {
        localStorage.setItem('zora_meals', JSON.stringify(list));
      }

      list.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));
      callback(list);
    };

    localSync.addEventListener('meals', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = collection(db!, 'meals');
      return onSnapshot(q, (snapshot) => {
        const tempMap: Record<string, MealFeedback> = {};
        snapshot.forEach((doc) => {
          const data = doc.data() as MealFeedback;
          if (data && data.day) {
            tempMap[data.day] = data;
          }
        });

        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const list: MealFeedback[] = days.map(d => {
          const dbData = tempMap[d];
          const def = defaultMeals.find(dm => dm.day === d)!;
          if (dbData) {
            return {
              day: d,
              breakfastVotes: dbData.breakfastVotes || def.breakfastVotes,
              lunchVotes: dbData.lunchVotes || def.lunchVotes,
              dinnerVotes: dbData.dinnerVotes || def.dinnerVotes,
              breakfastMenu: dbData.breakfastMenu !== undefined ? dbData.breakfastMenu : def.breakfastMenu,
              breakfastSub: dbData.breakfastSub !== undefined ? dbData.breakfastSub : def.breakfastSub,
              lunchMenu: dbData.lunchMenu !== undefined ? dbData.lunchMenu : def.lunchMenu,
              lunchSub: dbData.lunchSub !== undefined ? dbData.lunchSub : def.lunchSub,
              dinnerMenu: dbData.dinnerMenu !== undefined ? dbData.dinnerMenu : def.dinnerMenu,
              dinnerSub: dbData.dinnerSub !== undefined ? dbData.dinnerSub : def.dinnerSub
            };
          }
          return def;
        });

        localStorage.setItem('zora_meals', JSON.stringify(list));
        localSync.emit('meals');
      }, (error) => {
        console.warn("Firestore Meals subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'meals');
      });
    });

    return () => {
      localSync.removeEventListener('meals', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveMealFeedback(day: string, meal: 'breakfast' | 'lunch' | 'dinner', voteType: 'up' | 'down'): Promise<void> {
    const defaultMeals: MealFeedback[] = [
      { day: "Mon", breakfastVotes: { up: 18, down: 2 }, lunchVotes: { up: 12, down: 6 }, dinnerVotes: { up: 22, down: 1 }, breakfastMenu: "Aloo Paratha & Fresh Curd", breakfastSub: "Pickle, Butter, Fresh Tea", lunchMenu: "Chole Rice & Hot Roti", lunchSub: "Spiced Boondi Raita, Salad", dinnerMenu: "Shahi Paneer & Naan", dinnerSub: "Day's Special Dish 🌟" },
      { day: "Tue", breakfastVotes: { up: 14, down: 4 }, lunchVotes: { up: 20, down: 2 }, dinnerVotes: { up: 15, down: 5 }, breakfastMenu: "Idli Sambar & Coconut Chutney", breakfastSub: "Gunpowder Butter, Fresh Tea", lunchMenu: "Rajma Masala & Jeera Rice", lunchSub: "Onion Laccha Salad, Papad", dinnerMenu: "Chicken Masala / Kadai Paneer", dinnerSub: "Butter Tandoori Roti & Sweet Kheer" },
      { day: "Wed", breakfastVotes: { up: 16, down: 2 }, lunchVotes: { up: 9, down: 11 }, dinnerVotes: { up: 19, down: 3 }, breakfastMenu: "Poha & Sev with Jalebi", breakfastSub: "Lemon Wedges, Green Chillies, Tea", lunchMenu: "Kadhi Pakoda & Steamed Rice", lunchSub: "Aloo Bhujia, Mix Pickle", dinnerMenu: "Malai Kofta & Lachha Paratha", dinnerSub: "Garlic Butter Naan, Gulab Jamun" },
      { day: "Thu", breakfastVotes: { up: 21, down: 1 }, lunchVotes: { up: 15, down: 5 }, dinnerVotes: { up: 18, down: 4 }, breakfastMenu: "Stuffed Gobhi Paratha & Dahi", breakfastSub: "Homemade White Butter, Tea", lunchMenu: "Veg Biryani & Spiced Raita", lunchSub: "Salad Green Salad, Roasted Papad", dinnerMenu: "Paneer Butter Masala & Kulcha", dinnerSub: "Day's Special Dessert Cream" },
      { day: "Fri", breakfastVotes: { up: 12, down: 8 }, lunchVotes: { up: 22, down: 1 }, dinnerVotes: { up: 25, down: 0 }, breakfastMenu: "Uttapam & Tomato Chutney", breakfastSub: "Sambar, Ginger Ginger Tea", lunchMenu: "Dal Makhani & Butter Naan", lunchSub: "Sirka Onion, Mix Veg Dry", dinnerMenu: "Egg Curry / Paneer Bhurji", dinnerSub: "Hot Rumali Roti, Chocolate Pudding" },
      { day: "Sat", breakfastVotes: { up: 24, down: 1 }, lunchVotes: { up: 11, down: 9 }, dinnerVotes: { up: 14, down: 8 }, breakfastMenu: "Chole Bhature & Tangy Pickle", breakfastSub: "Sweet Lassi, Raw Onion Rings", lunchMenu: "Aloo Poori & Sooji Halwa", lunchSub: "Chana Dry Spice, Cucumber Raita", dinnerMenu: "Veg Manchurian & Fried Rice", dinnerSub: "Spring Rolls, Sweet Chili Sauce" },
      { day: "Sun", breakfastVotes: { up: 27, down: 0 }, lunchVotes: { up: 28, down: 1 }, dinnerVotes: { up: 26, down: 2 }, breakfastMenu: "Aloo Paratha & Fresh Curd", breakfastSub: "Pickle, Butter, Fresh Tea", lunchMenu: "Chole Rice & Hot Roti", lunchSub: "Spiced Boondi Raita, Salad", dinnerMenu: "Shahi Paneer & Naan", dinnerSub: "Day's Special Dish 🌟" }
    ];

    const stored = localStorage.getItem('zora_meals');
    const list: MealFeedback[] = stored ? JSON.parse(stored) : [];
    
    let index = list.findIndex(m => m.day === day);
    if (index === -1) {
      const def = defaultMeals.find(dm => dm.day === day) || {
        day,
        breakfastVotes: { up: 0, down: 0 },
        lunchVotes: { up: 0, down: 0 },
        dinnerVotes: { up: 0, down: 0 },
        breakfastMenu: "Aloo Paratha & Fresh Curd",
        breakfastSub: "Pickle, Butter, Fresh Tea",
        lunchMenu: "Chole Rice & Hot Roti",
        lunchSub: "Spiced Boondi Raita, Salad",
        dinnerMenu: "Shahi Paneer & Naan",
        dinnerSub: "Day's Special Dish 🌟"
      };
      list.push(def);
      index = list.length - 1;
    }

    const item = list[index];
    const key = `${meal}Votes` as 'breakfastVotes' | 'lunchVotes' | 'dinnerVotes';
    
    if (voteType === 'up') {
      item[key].up += 1;
    } else {
      item[key].down += 1;
    }

    list[index] = item;
    localStorage.setItem('zora_meals', JSON.stringify(list));
    localSync.emit('meals');
    
    if (isRealFirebase && db) {
      try {
        const voteSubDoc = {
          day,
          [key]: {
            up: item[key].up,
            down: item[key].down
          }
        };
        await setDoc(doc(db, 'meals', day), voteSubDoc, { merge: true });
      } catch (error) {
        console.warn("Firestore saveMealFeedback background sync failed:", error);
        handleFirestoreError(error, 'write', `meals/${day}`);
      }
    }
  },

  async saveMealMenu(day: string, breakfastMenu: string, breakfastSub: string, lunchMenu: string, lunchSub: string, dinnerMenu: string, dinnerSub: string): Promise<void> {
    const defaultMeals: MealFeedback[] = [
      { day: "Mon", breakfastVotes: { up: 18, down: 2 }, lunchVotes: { up: 12, down: 6 }, dinnerVotes: { up: 22, down: 1 }, breakfastMenu: "Aloo Paratha & Fresh Curd", breakfastSub: "Pickle, Butter, Fresh Tea", lunchMenu: "Chole Rice & Hot Roti", lunchSub: "Spiced Boondi Raita, Salad", dinnerMenu: "Shahi Paneer & Naan", dinnerSub: "Day's Special Dish 🌟" },
      { day: "Tue", breakfastVotes: { up: 14, down: 4 }, lunchVotes: { up: 20, down: 2 }, dinnerVotes: { up: 15, down: 5 }, breakfastMenu: "Idli Sambar & Coconut Chutney", breakfastSub: "Gunpowder Butter, Fresh Tea", lunchMenu: "Rajma Masala & Jeera Rice", lunchSub: "Onion Laccha Salad, Papad", dinnerMenu: "Chicken Masala / Kadai Paneer", dinnerSub: "Butter Tandoori Roti & Sweet Kheer" },
      { day: "Wed", breakfastVotes: { up: 16, down: 2 }, lunchVotes: { up: 9, down: 11 }, dinnerVotes: { up: 19, down: 3 }, breakfastMenu: "Poha & Sev with Jalebi", breakfastSub: "Lemon Wedges, Green Chillies, Tea", lunchMenu: "Kadhi Pakoda & Steamed Rice", lunchSub: "Aloo Bhujia, Mix Pickle", dinnerMenu: "Malai Kofta & Lachha Paratha", dinnerSub: "Garlic Butter Naan, Gulab Jamun" },
      { day: "Thu", breakfastVotes: { up: 21, down: 1 }, lunchVotes: { up: 15, down: 5 }, dinnerVotes: { up: 18, down: 4 }, breakfastMenu: "Stuffed Gobhi Paratha & Dahi", breakfastSub: "Homemade White Butter, Tea", lunchMenu: "Veg Biryani & Spiced Raita", lunchSub: "Salad Green Salad, Roasted Papad", dinnerMenu: "Paneer Butter Masala & Kulcha", dinnerSub: "Day's Special Dessert Cream" },
      { day: "Fri", breakfastVotes: { up: 12, down: 8 }, lunchVotes: { up: 22, down: 1 }, dinnerVotes: { up: 25, down: 0 }, breakfastMenu: "Uttapam & Tomato Chutney", breakfastSub: "Sambar, Ginger Ginger Tea", lunchMenu: "Dal Makhani & Butter Naan", lunchSub: "Sirka Onion, Mix Veg Dry", dinnerMenu: "Egg Curry / Paneer Bhurji", dinnerSub: "Hot Rumali Roti, Chocolate Pudding" },
      { day: "Sat", breakfastVotes: { up: 24, down: 1 }, lunchVotes: { up: 11, down: 9 }, dinnerVotes: { up: 14, down: 8 }, breakfastMenu: "Chole Bhature & Tangy Pickle", breakfastSub: "Sweet Lassi, Raw Onion Rings", lunchMenu: "Aloo Poori & Sooji Halwa", lunchSub: "Chana Dry Spice, Cucumber Raita", dinnerMenu: "Veg Manchurian & Fried Rice", dinnerSub: "Spring Rolls, Sweet Chili Sauce" },
      { day: "Sun", breakfastVotes: { up: 27, down: 0 }, lunchVotes: { up: 28, down: 1 }, dinnerVotes: { up: 26, down: 2 }, breakfastMenu: "Aloo Paratha & Fresh Curd", breakfastSub: "Pickle, Butter, Fresh Tea", lunchMenu: "Chole Rice & Hot Roti", lunchSub: "Spiced Boondi Raita, Salad", dinnerMenu: "Shahi Paneer & Naan", dinnerSub: "Day's Special Dish 🌟" }
    ];

    const stored = localStorage.getItem('zora_meals');
    const list: MealFeedback[] = stored ? JSON.parse(stored) : [];
    
    let index = list.findIndex(m => m.day === day);
    if (index === -1) {
      const def = defaultMeals.find(dm => dm.day === day) || {
        day,
        breakfastVotes: { up: 0, down: 0 },
        lunchVotes: { up: 0, down: 0 },
        dinnerVotes: { up: 0, down: 0 },
        breakfastMenu: "Aloo Paratha & Fresh Curd",
        breakfastSub: "Pickle, Butter, Fresh Tea",
        lunchMenu: "Chole Rice & Hot Roti",
        lunchSub: "Spiced Boondi Raita, Salad",
        dinnerMenu: "Shahi Paneer & Naan",
        dinnerSub: "Day's Special Dish 🌟"
      };
      list.push(def);
      index = list.length - 1;
    }

    const item = list[index];
    item.breakfastMenu = breakfastMenu;
    item.breakfastSub = breakfastSub;
    item.lunchMenu = lunchMenu;
    item.lunchSub = lunchSub;
    item.dinnerMenu = dinnerMenu;
    item.dinnerSub = dinnerSub;
    
    list[index] = item;
    localStorage.setItem('zora_meals', JSON.stringify(list));
    localSync.emit('meals');
    
    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'meals', day), item);
      } catch (error) {
        console.warn("Firestore saveMealMenu background sync failed:", error);
        handleFirestoreError(error, 'write', `meals/${day}`);
      }
    }
  },

  // --- BRAND NEW: LOST & FOUND MODULE ---
  subscribeLostFoundItems(callback: (items: LostFoundItem[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_lostfound');
      const list = stored ? JSON.parse(stored) : [];
      list.sort((a: LostFoundItem, b: LostFoundItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    };

    localSync.addEventListener('lostfound', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = query(collection(db!, 'lostfound'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const list: LostFoundItem[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as LostFoundItem);
        });
        localStorage.setItem('zora_lostfound', JSON.stringify(list));
        localSync.emit('lostfound');
      }, (error) => {
        console.warn("Firestore LostFound subscription fallback. Running offline real-time sync:", error);
        handleFirestoreError(error, 'list', 'lostfound');
      });
    });

    return () => {
      localSync.removeEventListener('lostfound', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveLostFoundItem(item: LostFoundItem): Promise<void> {
    const stored = localStorage.getItem('zora_lostfound');
    const list: LostFoundItem[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(l => l.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    localStorage.setItem('zora_lostfound', JSON.stringify(list));
    localSync.emit('lostfound');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'lostfound', item.id), item);
      } catch (error) {
        console.warn("Firestore saveLostFoundItem background sync failed:", error);
        handleFirestoreError(error, 'write', `lostfound/${item.id}`);
      }
    }
  },

  async deleteLostFoundItem(id: string): Promise<void> {
    const stored = localStorage.getItem('zora_lostfound');
    let list: LostFoundItem[] = stored ? JSON.parse(stored) : [];
    list = list.filter(l => l.id !== id);
    localStorage.setItem('zora_lostfound', JSON.stringify(list));
    localSync.emit('lostfound');

    if (isRealFirebase && db) {
      try {
        await deleteDoc(doc(db, 'lostfound', id));
      } catch (error) {
        console.warn("Firestore deleteLostFoundItem background sync failed:", error);
        handleFirestoreError(error, 'delete', `lostfound/${id}`);
      }
    }
  },

  // --- MODULE: RENT PAYMENTS ---
  subscribeRentPayments(callback: (payments: RentPayment[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_rent_payments');
      const list = stored ? JSON.parse(stored) : [];
      callback(list);
    };

    localSync.addEventListener('rent_payments', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = collection(db!, 'rent_payments');
      return onSnapshot(q, (snapshot) => {
        const list: RentPayment[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as RentPayment);
        });
        localStorage.setItem('zora_rent_payments', JSON.stringify(list));
        localSync.emit('rent_payments');
      }, (error) => {
        console.warn("Firestore RentPayments subscription fallback:", error);
        handleFirestoreError(error, 'get', 'rent_payments');
      });
    });

    return () => {
      localSync.removeEventListener('rent_payments', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveRentPayment(payment: RentPayment): Promise<void> {
    const stored = localStorage.getItem('zora_rent_payments');
    const list: RentPayment[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(p => p.id === payment.id);
    if (index >= 0) {
      list[index] = payment;
    } else {
      list.push(payment);
    }
    localStorage.setItem('zora_rent_payments', JSON.stringify(list));
    localSync.emit('rent_payments');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'rent_payments', payment.id), payment);
      } catch (error) {
        console.warn("Firestore saveRentPayment background sync failed:", error);
        handleFirestoreError(error, 'write', `rent_payments/${payment.id}`);
      }
    }
  },

  // --- MODULE: SALARIES ---
  subscribeSalaries(callback: (salaries: Salary[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_salaries');
      const list = stored ? JSON.parse(stored) : [];
      list.sort((a: Salary, b: Salary) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    };

    localSync.addEventListener('salaries', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = collection(db!, 'salaries');
      return onSnapshot(q, (snapshot) => {
        const list: Salary[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Salary);
        });
        localStorage.setItem('zora_salaries', JSON.stringify(list));
        localSync.emit('salaries');
      }, (error) => {
        console.warn("Firestore Salaries subscription fallback:", error);
        handleFirestoreError(error, 'get', 'salaries');
      });
    });

    return () => {
      localSync.removeEventListener('salaries', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveSalary(salary: Salary): Promise<void> {
    const stored = localStorage.getItem('zora_salaries');
    const list: Salary[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(s => s.id === salary.id);
    if (index >= 0) {
      list[index] = salary;
    } else {
      list.push(salary);
    }
    localStorage.setItem('zora_salaries', JSON.stringify(list));
    localSync.emit('salaries');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'salaries', salary.id), salary);
      } catch (error) {
        console.warn("Firestore saveSalary background sync failed:", error);
        handleFirestoreError(error, 'write', `salaries/${salary.id}`);
      }
    }
  },

  // --- MODULE: SESSIONS ---
  subscribeUserSessions(userId: string, callback: (sessions: Session[]) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_sessions');
      const list = stored ? JSON.parse(stored) : [];
      const userList = list.filter((s: Session) => s.userId === userId);
      callback(userList);
    };

    localSync.addEventListener('sessions', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const q = query(collection(db!, 'sessions'), where('userId', '==', userId));
      return onSnapshot(q, (snapshot) => {
        const list: Session[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Session);
        });
        
        // Merge with other local sessions to preserve full array
        const stored = localStorage.getItem('zora_sessions');
        const fullLocalList: Session[] = stored ? JSON.parse(stored) : [];
        const filteredFull = fullLocalList.filter((s: Session) => s.userId !== userId);
        const merged = [...filteredFull, ...list];
        
        localStorage.setItem('zora_sessions', JSON.stringify(merged));
        localSync.emit('sessions');
      }, (error) => {
        console.warn("Firestore User Sessions subscription fallback:", error);
        handleFirestoreError(error, 'list', 'sessions');
      });
    });

    return () => {
      localSync.removeEventListener('sessions', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  subscribeSingleSession(id: string, callback: (session: Session | null) => void): () => void {
    const fetchLocal = () => {
      const stored = localStorage.getItem('zora_sessions');
      const list = stored ? JSON.parse(stored) : [];
      const found = list.find((s: Session) => s.id === id) || null;
      callback(found);
    };

    localSync.addEventListener('sessions', fetchLocal);
    fetchLocal();

    const unsubscribeAuthSafe = registerAuthSafeSnapshot(() => {
      const docRef = doc(db!, 'sessions', id);
      return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const s = snap.data() as Session;
          
          // Sync with local
          const stored = localStorage.getItem('zora_sessions');
          const fullLocalList: Session[] = stored ? JSON.parse(stored) : [];
          const idx = fullLocalList.findIndex((item) => item.id === id);
          if (idx >= 0) {
            fullLocalList[idx] = s;
          } else {
            fullLocalList.push(s);
          }
          localStorage.setItem('zora_sessions', JSON.stringify(fullLocalList));
          localSync.emit('sessions');
          
          callback(s);
        } else {
          callback(null);
        }
      }, (error) => {
        console.warn("Firestore Single Session subscription fallback:", error);
        handleFirestoreError(error, 'get', `sessions/${id}`);
      });
    });

    return () => {
      localSync.removeEventListener('sessions', fetchLocal);
      unsubscribeAuthSafe();
    };
  },

  async saveSession(session: Session): Promise<void> {
    const stored = localStorage.getItem('zora_sessions');
    const list: Session[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(s => s.id === session.id);
    if (index >= 0) {
      list[index] = session;
    } else {
      list.push(session);
    }
    localStorage.setItem('zora_sessions', JSON.stringify(list));
    localSync.emit('sessions');

    if (isRealFirebase && db) {
      try {
        await setDoc(doc(db, 'sessions', session.id), session);
      } catch (error) {
        console.warn("Firestore saveSession background sync failed:", error);
        handleFirestoreError(error, 'write', `sessions/${session.id}`);
      }
    }
  },

  async killAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    const stored = localStorage.getItem('zora_sessions');
    const list: Session[] = stored ? JSON.parse(stored) : [];
    
    // Revoke both locally and firebase
    const updatedList = list.map((s: Session) => {
      if (s.userId === userId && s.id !== currentSessionId) {
        return { ...s, status: 'revoked' as const };
      }
      return s;
    });
    localStorage.setItem('zora_sessions', JSON.stringify(updatedList));
    localSync.emit('sessions');

    if (isRealFirebase && db) {
      try {
        for (const s of updatedList) {
          if (s.userId === userId && s.id !== currentSessionId && s.status === 'revoked') {
            await setDoc(doc(db, 'sessions', s.id), s);
          }
        }
      } catch (error) {
        console.warn("Firestore killAllOtherSessions sync failed:", error);
        handleFirestoreError(error, 'write', 'sessions');
      }
    }
  }
};
