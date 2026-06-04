# Security Specification: Zora Stays Firestore Attribute-Based Access Control

## 1. Data Invariants
- **Tenants**: A tenant profile contains sensitive personal details (phone number, gender, address). Tenants may only create/update their own profiles or be managed by properties administrators.
- **Tickets**: Residents can raise compliance/maintenance logs. Only the assigning resident or administrators can edit or view sensitive comments.
- **Notifications**: Targeted notifications map specifically to a recipient tenant or property manager and are read-only for any other party.
- **GatePasses**: Booking a leave or late entry is tied securely to the authenticated resident. Only managers can transition status to `approved` or `rejected`.
- **Notices**: System notices are read-only for residents; managers have complete write privilege.
- **MealFeedback**: Food review counters cannot be manipulated or decremented below minimum bounds.

---

## 2. The "Dirty Dozen" Payloads (Red Team Attack Scenarios)

These payloads must be rejected securely by our Zero-Trust Firestore Security Rule set.

### 1. Identity Spoofing on Tenant Profile
- **Vulnerability**: Tenant T102 attempts to overwrite Tenant T101's profile info.
- **Action**: `write` to `/tenants/T101` as user `uid = T102`
- **Output**: `PERMISSION_DENIED`

### 2. Size Poisoning on Tenant Name
- **Vulnerability**: Attacker injects a 5MB garbage string into the `name` field leading to storage resource exhaustion.
- **Action**: Creating tenant with a name size > 100 characters.
- **Output**: `PERMISSION_DENIED`

### 3. Arbitrary Field Injection (Shadow Update)
- **Vulnerability**: Attacker appends a `role: "admin"` property inside a tenant document payload to gain privileged routing rights.
- **Action**: Create or Update profile with unverified schema keys.
- **Output**: `PERMISSION_DENIED`

### 4. Identity Spoofing on Ticket Creation
- **Vulnerability**: Resident authenticated as `T102` attempts to raise a complaint ticket on behalf of `T101`.
- **Action**: Create ticket doc with `tenantId = T101`
- **Output**: `PERMISSION_DENIED`

### 5. Ticket Status State Bypass
- **Vulnerability**: A regular tenant raises a new ticket and pre-approves/resolves it immediately.
- **Action**: Create ticket with `status = "resolved"` directly in initial payload.
- **Output**: `PERMISSION_DENIED`

### 6. Unauthorized Ticket Deletion
- **Vulnerability**: Authenticated user attempts to delete another tenant's ticket without permissions.
- **Action**: Delete `/tickets/TKT-101`
- **Output**: `PERMISSION_DENIED`

### 7. State Shortcutting on Gate Pass Approval
- **Vulnerability**: A resident issues a GatePass and bypasses the approval loop by submitting the document with `status: "approved"`.
- **Action**: Create gatepass with `status = "approved"` set on creation.
- **Output**: `PERMISSION_DENIED`

### 8. Identity Spoofing on Gate Pass Creation
- **Vulnerability**: Resident `T102` creates a gatepass under `T101` ID.
- **Action**: Create path `/gatepasses/GP-1` with `tenantId: "T101"`
- **Output**: `PERMISSION_DENIED`

### 9. Unauthorized Notice Injection
- **Vulnerability**: Tenant inserts a fake system notification directly into `/notices/` to advertise external schemes.
- **Action**: Create notice item with custom announcement.
- **Output**: `PERMISSION_DENIED`

### 10. Value Poisoning on Meal Feedback Upvotes
- **Vulnerability**: Negative integer input or extremely large bounds submitted to upvotes.
- **Action**: Inject meal votes decrement to skip reviews.
- **Output**: `PERMISSION_DENIED`

### 11. Id Poisoning Guard on GatePass ID
- **Vulnerability**: Attacker injects an excessively long string with escape sequences as Firestore document ID.
- **Action**: Create `/gatepasses/INVALID_ID_CHARS_EXTREMELY_LONG_OVER_128_CHARS`
- **Output**: `PERMISSION_DENIED`

### 12. Notification Hijacking
- **Vulnerability**: Non-recipient user marking a private alert as read.
- **Action**: Attempting to update `read` property for a notification whose destination ID does not match the requester's UID.
- **Output**: `PERMISSION_DENIED`

---

## 3. The Test Runner (`firestore.rules.test.ts`)
```typescript
import { 
  initializeTestEnvironment, 
  RulesTestEnvironment 
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'essential-hawk-dh7sp',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Dirty Dozen Payload protections should reject malformed payloads", async () => {
  const aliceContext = testEnv.authenticatedContext('T101');
  const bobContext = testEnv.authenticatedContext('T102');
  
  // Test 1: Identity Spoofing on Tenant Profile
  await expect(
    setDoc(doc(bobContext.firestore(), 'tenants', 'T101'), { name: 'Elena' })
  ).rejects.toThrow();

  // Test 2: Size Poisoning on name
  await expect(
    setDoc(doc(aliceContext.firestore(), 'tenants', 'T101'), { 
      tenantId: 'T101',
      name: 'A'.repeat(500), 
      residingSince: '2026-06-01',
      roomNumber: '101A'
    })
  ).rejects.toThrow();
});
```
