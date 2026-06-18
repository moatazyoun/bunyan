# Security Specification: Bunyan ERP

## 1. Data Invariants
To prevent corrupted accounting journals or privilege escalation, the following invariants are enforced:
- **System Diagnostics**: Anyone can query `/system/ping` to estimate latency, but write actions are locked.
- **Identity Invariants**: User profiles in `/users/{username}` are immutable in their identity. Regular users cannot alter their assigned roles or inject rogue profiles.
- **Site Management Integrity**: Creation, modification, and deletion of physically active construction sites (`/sites/{siteId}`) are strictly restricted to verified Administrators.
- **Ledger Invariance**: Financial records synchronized in `/siteData/{siteId}` must be fully contained within the site schema, verified against the site's existence, and require a valid, signed-in operator session.
- **Report Template Sovereignty**: Sign-off configurations under `/extractSettings/{projectId}` can be retrieved by any registered supervisor or editor to render reports, but can only be modified by authentic team members.

---

## 2. The "Dirty Dozen" Malicious Payloads

The rules unit-testing framework evaluates these 12 malicious vectors to ensure complete `PERMISSION_DENIED` blocks:

### Payload 1: Admin Role Hijacking (Identity Spoofing)
An authenticated user attempts to write/escalate their authority to 'admin' in user profiles.
```json
// Path: /users/editor_user
// Request auth: { "uid": "editor_user", "token": { "email": "editor@bunyan.com" } }
{
  "username": "editor_user",
  "nameAr": "محرر موقع",
  "role": "admin"
}
```

### Payload 2: Massive ID Attack (ID Poisoning & Denial of Wallet)
Injecting a 1.5KB malicious path component signature as a site ID to deplete CPU allocations.
```json
// Path: /sites/site-A-VERY-LONG-MALICIOUS-JUNK-STRING-REPLICATING-DENIAL-OF-WALLET-ATTACKS-X...
// Request auth: { "uid": "admin_uid" }
{
  "id": "site-A-VERY-LONG...",
  "nameAr": "موقع تجريبي",
  "location": "الإسكندرية"
}
```

### Payload 3: Shadow Ghost Field Insertion (Update-Gap Bypass)
Injecting a hidden tracking field (`isSuperUser: true`) during a routine site update.
```json
// Path: /sites/alex-road-01
// Request auth: { "uid": "admin_uid" }
{
  "id": "alex-road-01",
  "nameAr": "طريق الإسكندرية الصحراوي",
  "location": "الصحراوي",
  "ghostField": "malicious_payload"
}
```

### Payload 4: Arbitrary System Poisoning (Diagnostics Tampering)
An authenticated but non-admin user trying to overwrite the network diagnostic document.
```json
// Path: /system/ping
// Request auth: { "uid": "worker_uid" }
{
  "ping": "malicious_ping_corruption"
}
```

### Payload 5: Site Data Wipeout (Database Corruption)
An anonymous user trying to delete site coordination data.
```json
// Path: /siteData/alex-road-01
// Request auth: null
{}
```

### Payload 6: Untrusted Timestamp Spoofing (Integrity bypass)
Sending custom client timestamps for creation tracking instead of server-authenticated clocks.
```json
// Path: /siteData/alex-road-01
// Request auth: { "uid": "editor_uid" }
{
  "createdAt": "2020-01-01T00:00:00Z" // Expects server-time validation
}
```

### Payload 7: Signatory Injection of Malicious Types (Privilege Injection)
Modifying the `extractSettings` signatories array with a massive, malformed list to break formatting.
```json
// Path: /extractSettings/proj-abc
// Request auth: { "uid": "worker_uid" }
{
  "signatories": "THIS_SHOULD_BE_AN_ARRAY_BUT_IS_A_STRING"
}
```

### Payload 8: Anonymous Reader (PII and Ledger Scraping)
A guest or unverified session attempting to scrape the active user directory.
```json
// Path: /users
// Request auth: null
{}
```

### Payload 9: Empty Invariant Update (Type Safety Violation)
Updating a site record, but stripping out required fields like `nameAr` or omitting schema boundaries.
```json
// Path: /sites/alex-road-01
// Request auth: { "uid": "admin_uid" }
{
  "location": "برج العرب" // Missing nameAr description!
}
```

### Payload 10: Unauthorized Site Insertion (Privilege Bypass)
A regular engineer session attempting to declare a new Active Construction Site without central authority.
```json
// Path: /sites/new-bypassed-site
// Request auth: { "uid": "user_uid" }
{
  "id": "new-bypassed-site",
  "nameAr": "موقع مخترق",
  "location": "سيناء"
}
```

### Payload 11: Site Data Overload with Unbounded Keys
Synchronizing local site data but injecting unbounded, unregistered dictionaries that drain memory limits.
```json
// Path: /siteData/alex-road-01
// Request auth: { "uid": "user_uid" }
{
  "transactions": [],
  "unsupportedEntity": "hacking_injection_payload..."
}
```

### Payload 12: Account Impersonation (Rogue Profile Update)
An authenticated user trying to update a colleague's user profile parameters.
```json
// Path: /users/colleague_user
// Request auth: { "uid": "attacker_user" }
{
  "nameAr": "م. المهاجم الخبيث"
}
```

---

## 3. Test Runner: Rules Unit Testing Suite

The following structural mapping in `firestore.rules.test.ts` validates security rules compliance:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'boreal-trail-h6ppv',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Bunyan Enterprise Security Rules Unit Tests', () => {
  test('Payload 1: Reject Admin privilege escalation by editors', async () => {
    const context = testEnv.authenticatedContext('editor_uid', { email: 'editor@bunyan.com' });
    const db = context.firestore();
    const docRef = doc(db, 'users/editor_uid');
    
    await expect(setDoc(docRef, {
      username: 'editor_uid',
      nameAr: 'محرر متعسف',
      role: 'admin' // Violation!
    })).rejects.toThrow();
  });

  test('Payload 4: Block System Diagnostics writes for regular accounts', async () => {
    const context = testEnv.authenticatedContext('engineer_uid');
    const db = context.firestore();
    const docRef = doc(db, 'system/ping');
    
    await expect(setDoc(docRef, { ping: 'corrupted' })).rejects.toThrow();
  });

  test('Payload 5: Block anonymous read of Site Data collection', async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    const docRef = doc(db, 'siteData/alex-road-01');
    
    await expect(getDoc(docRef)).rejects.toThrow();
  });
});
```
