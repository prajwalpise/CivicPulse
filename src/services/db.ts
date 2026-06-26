import { db, isFirebaseConfigured } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp 
} from "firebase/firestore";
import { Issue, UserProfile, Comment, Notification, BADGE_SYSTEM } from "../types";
import { DEMO_ISSUES, DEMO_USERS, DEMO_COMMENTS } from "./seedData";

// Toast callback subscription for badge earnings
type ToastCallback = (message: string) => void;
let badgeToastCallback: ToastCallback | null = null;

export function registerBadgeToastCallback(cb: ToastCallback) {
  badgeToastCallback = cb;
}

function triggerBadgeToast(badgeName: string) {
  if (badgeToastCallback) {
    badgeToastCallback(`🎉 You earned the "${badgeName}" badge!`);
  }
}

// Memory-based local storage listener registry
type Listener = () => void;
const localListeners: Record<string, Listener[]> = {};

export function subscribeToLocalChange(colName: string, cb: Listener) {
  if (!localListeners[colName]) {
    localListeners[colName] = [];
  }
  localListeners[colName].push(cb);
  return () => {
    localListeners[colName] = localListeners[colName].filter(item => item !== cb);
  };
}

function notifyLocalChange(colName: string) {
  if (localListeners[colName]) {
    localListeners[colName].forEach(cb => cb());
  }
}

// Check and award badges logic
export function checkAndAwardBadges(user: UserProfile): { user: UserProfile; unlocked: string[] } {
  const unlocked: string[] = [];
  const existingBadges = new Set(user.badges);

  if (user.issuesReported >= 1 && !existingBadges.has("first_step")) {
    unlocked.push("first_step");
    user.points += 10;
  }
  if (user.issuesReported >= 5 && !existingBadges.has("watchdog")) {
    unlocked.push("watchdog");
    user.points += 50;
  }
  if (user.issuesReported >= 10 && !existingBadges.has("local_hero")) {
    unlocked.push("local_hero");
    user.points += 100;
  }
  if (user.issuesReported >= 25 && !existingBadges.has("city_guardian")) {
    unlocked.push("city_guardian");
    user.points += 200;
  }
  if (user.upvotesReceived >= 50 && !existingBadges.has("verified_voice")) {
    unlocked.push("verified_voice");
  }
  if (user.issuesResolved >= 5 && !existingBadges.has("problem_solver")) {
    unlocked.push("problem_solver");
  }
  if (user.points >= 500 && !existingBadges.has("elite_citizen")) {
    unlocked.push("elite_citizen");
  }

  if (unlocked.length > 0) {
    user.badges = [...user.badges, ...unlocked];
    // Trigger notifications/toasts for unlocked badges
    unlocked.forEach(badgeId => {
      const badge = BADGE_SYSTEM.find(b => b.id === badgeId);
      if (badge) {
        triggerBadgeToast(badge.name);
        // Create badge notification
        createNotification(user.id, `You unlocked a new badge: ${badge.icon} ${badge.name}!`, "", "badge");
      }
    });
  }

  return { user, unlocked };
}

// Initial storage hydration
function hydrateLocalStorage() {
  if (!localStorage.getItem("civicpulse_hydrated")) {
    localStorage.setItem("civicpulse_issues", JSON.stringify(DEMO_ISSUES));
    localStorage.setItem("civicpulse_users", JSON.stringify(DEMO_USERS));
    localStorage.setItem("civicpulse_comments", JSON.stringify(DEMO_COMMENTS));
    localStorage.setItem("civicpulse_notifications", JSON.stringify([]));
    localStorage.setItem("civicpulse_hydrated", "true");
  }
}

hydrateLocalStorage();

// HELPERS FOR LOCAL STORAGE OPERATIONS
function getLocalIssues(): Issue[] {
  return JSON.parse(localStorage.getItem("civicpulse_issues") || "[]");
}

function saveLocalIssues(issues: Issue[]) {
  localStorage.setItem("civicpulse_issues", JSON.stringify(issues));
  notifyLocalChange("issues");
}

function getLocalUsers(): UserProfile[] {
  return JSON.parse(localStorage.getItem("civicpulse_users") || "[]");
}

function saveLocalUsers(users: UserProfile[]) {
  localStorage.setItem("civicpulse_users", JSON.stringify(users));
  notifyLocalChange("users");
}

function getLocalComments(): Comment[] {
  return JSON.parse(localStorage.getItem("civicpulse_comments") || "[]");
}

function saveLocalComments(comments: Comment[]) {
  localStorage.setItem("civicpulse_comments", JSON.stringify(comments));
  notifyLocalChange("comments");
}

function getLocalNotifications(): Notification[] {
  return JSON.parse(localStorage.getItem("civicpulse_notifications") || "[]");
}

function saveLocalNotifications(notifications: Notification[]) {
  localStorage.setItem("civicpulse_notifications", JSON.stringify(notifications));
  notifyLocalChange("notifications");
}

// EXPORTED INTEGRATION API INTERFACES
export async function getIssues(): Promise<Issue[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const list: Issue[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Issue);
      });
      // If Firestore is empty, auto-seed and reload
      if (list.length === 0) {
        await seedFirestore();
        return getIssues();
      }
      return list;
    } catch (e) {
      console.error("Firestore getIssues failed, falling back to local:", e);
      return getLocalIssues();
    }
  } else {
    return getLocalIssues().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function getIssueById(id: string): Promise<Issue | null> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "issues", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Issue;
      }
      return null;
    } catch (e) {
      console.error("Firestore getIssueById failed, using local:", e);
      return getLocalIssues().find(i => i.id === id) || null;
    }
  } else {
    return getLocalIssues().find(i => i.id === id) || null;
  }
}

export async function addIssue(issueData: Omit<Issue, "id" | "upvotes" | "upvoteCount" | "comments" | "statusHistory" | "createdAt" | "updatedAt">): Promise<string> {
  const newIssue: Issue = {
    ...issueData,
    id: `issue_${Date.now()}`,
    upvotes: [],
    upvoteCount: 0,
    comments: 0,
    statusHistory: [
      { status: "Reported", timestamp: new Date().toISOString(), note: "Report logged on CivicPulse." }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      const docRef = await addDoc(collection(db, "issues"), {
        ...newIssue,
        createdAt: newIssue.createdAt,
        updatedAt: newIssue.updatedAt
      });
      // Award user points (+10 for reporting)
      await awardPoints(issueData.reportedBy, 10, "issuesReported");
      return docRef.id;
    } catch (e) {
      console.error("Firestore addIssue failed, saving locally:", e);
    }
  }

  // Fallback / Local Storage
  const local = getLocalIssues();
  local.unshift(newIssue);
  saveLocalIssues(local);
  await awardPoints(issueData.reportedBy, 10, "issuesReported");
  return newIssue.id;
}

export async function updateIssueStatus(issueId: string, newStatus: "Reported" | "Under Review" | "In Progress" | "Resolved", note: string): Promise<void> {
  const time = new Date().toISOString();
  
  if (isFirebaseConfigured) {
    try {
      const issueRef = doc(db, "issues", issueId);
      const issueSnap = await getDoc(issueRef);
      if (issueSnap.exists()) {
        const issue = issueSnap.data() as Issue;
        const history = [...(issue.statusHistory || []), { status: newStatus, timestamp: time, note }];
        
        const updates: any = {
          status: newStatus,
          statusHistory: history,
          updatedAt: time
        };

        if (newStatus === "Resolved") {
          updates.resolvedAt = time;
        }

        await updateDoc(issueRef, updates);

        // Notify reporter of status change
        await createNotification(
          issue.reportedBy, 
          `Your report "${issue.title}" is now: ${newStatus}`, 
          issueId, 
          newStatus === "Resolved" ? "resolved" : "status_change"
        );

        // If resolved, award +20 points to reporter
        if (newStatus === "Resolved" && issue.status !== "Resolved") {
          await awardPoints(issue.reportedBy, 20, "issuesResolved");
        }
        return;
      }
    } catch (e) {
      console.error("Firestore updateIssueStatus failed, using local:", e);
    }
  }

  // Local Storage
  const local = getLocalIssues();
  const index = local.findIndex(i => i.id === issueId);
  if (index !== -1) {
    const issue = local[index];
    const prevStatus = issue.status;
    issue.status = newStatus;
    issue.statusHistory.push({ status: newStatus, timestamp: time, note });
    issue.updatedAt = time;
    if (newStatus === "Resolved") {
      issue.resolvedAt = time;
    }
    saveLocalIssues(local);

    // Notifications
    await createNotification(
      issue.reportedBy, 
      `Your report "${issue.title}" is now: ${newStatus}`, 
      issueId, 
      newStatus === "Resolved" ? "resolved" : "status_change"
    );

    if (newStatus === "Resolved" && prevStatus !== "Resolved") {
      await awardPoints(issue.reportedBy, 20, "issuesResolved");
    }
  }
}

export async function upvoteIssue(issueId: string, userId: string): Promise<{ success: boolean; upvoteCount: number; upvoted: boolean }> {
  if (isFirebaseConfigured) {
    try {
      const issueRef = doc(db, "issues", issueId);
      const issueSnap = await getDoc(issueRef);
      if (issueSnap.exists()) {
        const issue = issueSnap.data() as Issue;
        const upvotes = issue.upvotes || [];
        const isUpvoted = upvotes.includes(userId);
        let updatedUpvotes: string[] = [];
        
        if (isUpvoted) {
          updatedUpvotes = upvotes.filter(id => id !== userId);
        } else {
          updatedUpvotes = [...upvotes, userId];
        }

        const count = updatedUpvotes.length;
        await updateDoc(issueRef, {
          upvotes: updatedUpvotes,
          upvoteCount: count
        });

        // Gamification: Give 1 point to upvote giver if upvoting
        if (!isUpvoted) {
          await awardPoints(userId, 1);
          // Create notification for reporter
          if (issue.reportedBy !== userId) {
            await createNotification(
              issue.reportedBy, 
              `Someone upvoted your report: "${issue.title}"`, 
              issueId, 
              "upvote"
            );
          }

          // If upvote count reaches 5, award +5 bonus to reporter
          if (count === 5) {
            await awardPoints(issue.reportedBy, 5, "upvotesReceived");
          } else {
            // Update recipient upvotes count
            await awardPoints(issue.reportedBy, 0, "upvotesReceived"); // simple trigger to recalculate / increment
          }
        }

        return { success: true, upvoteCount: count, upvoted: !isUpvoted };
      }
    } catch (e) {
      console.error("Firestore upvoteIssue failed, using local:", e);
    }
  }

  // Local Storage
  const local = getLocalIssues();
  const index = local.findIndex(i => i.id === issueId);
  if (index !== -1) {
    const issue = local[index];
    const upvotes = issue.upvotes || [];
    const isUpvoted = upvotes.includes(userId);
    let updatedUpvotes: string[] = [];

    if (isUpvoted) {
      updatedUpvotes = upvotes.filter(id => id !== userId);
    } else {
      updatedUpvotes = [...upvotes, userId];
    }

    issue.upvotes = updatedUpvotes;
    issue.upvoteCount = updatedUpvotes.length;
    saveLocalIssues(local);

    if (!isUpvoted) {
      await awardPoints(userId, 1);
      if (issue.reportedBy !== userId) {
        await createNotification(
          issue.reportedBy, 
          `Someone upvoted your report: "${issue.title}"`, 
          issueId, 
          "upvote"
        );
      }
      
      // Points tracking & award to reporter
      const localUsers = getLocalUsers();
      const repIdx = localUsers.findIndex(u => u.id === issue.reportedBy);
      if (repIdx !== -1) {
        localUsers[repIdx].upvotesReceived += 1;
        if (issue.upvoteCount === 5) {
          localUsers[repIdx].points += 5; // +5 points bonus
        }
        const check = checkAndAwardBadges(localUsers[repIdx]);
        localUsers[repIdx] = check.user;
        saveLocalUsers(localUsers);
      }
    }

    return { success: true, upvoteCount: issue.upvoteCount, upvoted: !isUpvoted };
  }

  return { success: false, upvoteCount: 0, upvoted: false };
}

export async function addComment(issueId: string, userId: string, userName: string, userPhoto: string, text: string): Promise<Comment> {
  const newComment: Comment = {
    id: `comment_${Date.now()}`,
    issueId,
    userId,
    userName,
    userPhoto,
    text,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      await addDoc(collection(db, "comments"), newComment);
      
      // Update issue comment count
      const issueRef = doc(db, "issues", issueId);
      const issueSnap = await getDoc(issueRef);
      if (issueSnap.exists()) {
        const issue = issueSnap.data() as Issue;
        await updateDoc(issueRef, {
          comments: (issue.comments || 0) + 1
        });

        // Award points (+2 to commenter)
        await awardPoints(userId, 2);

        // Notify reporter
        if (issue.reportedBy !== userId) {
          await createNotification(
            issue.reportedBy,
            `${userName} commented on your report: "${issue.title}"`,
            issueId,
            "comment"
          );
        }
      }
      return newComment;
    } catch (e) {
      console.error("Firestore addComment failed, using local:", e);
    }
  }

  // Local Storage
  const comments = getLocalComments();
  comments.push(newComment);
  saveLocalComments(comments);

  // Update comments count on Issue
  const issues = getLocalIssues();
  const issIdx = issues.findIndex(i => i.id === issueId);
  if (issIdx !== -1) {
    const issue = issues[issIdx];
    issue.comments = (issue.comments || 0) + 1;
    saveLocalIssues(issues);

    // Award points (+2 to commenter)
    await awardPoints(userId, 2);

    // Notify reporter
    if (issue.reportedBy !== userId) {
      await createNotification(
        issue.reportedBy,
        `${userName} commented on your report: "${issue.title}"`,
        issueId,
        "comment"
      );
    }
  }

  return newComment;
}

export async function getComments(issueId: string): Promise<Comment[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, "comments"), 
        where("issueId", "==", issueId), 
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      const list: Comment[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Comment);
      });
      return list;
    } catch (e) {
      console.error("Firestore getComments failed, using local:", e);
    }
  }

  return getLocalComments()
    .filter(c => c.issueId === issueId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (e) {
      console.error("Firestore getUserProfile failed, using local:", e);
    }
  }

  return getLocalUsers().find(u => u.id === userId) || null;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "users", profile.id);
      await setDoc(docRef, profile);
      return;
    } catch (e) {
      console.error("Firestore createUserProfile failed, using local:", e);
    }
  }

  const users = getLocalUsers();
  if (!users.some(u => u.id === profile.id)) {
    users.push(profile);
    saveLocalUsers(users);
  }
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, data);
      return;
    } catch (e) {
      console.error("Firestore updateUserProfile failed, using local:", e);
    }
  }

  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...data } as UserProfile;
    saveLocalUsers(users);
  }
}

export async function awardPoints(userId: string, pts: number, statToIncrement?: "issuesReported" | "issuesResolved" | "upvotesReceived"): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const user = docSnap.data() as UserProfile;
        const updatedUser = { ...user };
        updatedUser.points += pts;
        if (statToIncrement) {
          updatedUser[statToIncrement] = (updatedUser[statToIncrement] || 0) + 1;
        }
        
        // Badge checks
        const check = checkAndAwardBadges(updatedUser);
        await setDoc(docRef, check.user);
        return;
      }
    } catch (e) {
      console.error("Firestore awardPoints failed, using local:", e);
    }
  }

  // Local storage
  const users = getLocalUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    const user = users[idx];
    user.points += pts;
    if (statToIncrement) {
      user[statToIncrement] = (user[statToIncrement] || 0) + 1;
    }
    const check = checkAndAwardBadges(user);
    users[idx] = check.user;
    saveLocalUsers(users);
  }
}

export async function getUsers(): Promise<UserProfile[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(collection(db, "users"), orderBy("points", "desc"));
      const querySnapshot = await getDocs(q);
      const list: UserProfile[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      return list;
    } catch (e) {
      console.error("Firestore getUsers failed, using local:", e);
    }
  }

  return getLocalUsers().sort((a, b) => b.points - a.points);
}

export async function createNotification(userId: string, message: string, issueId: string, type: "upvote" | "status_change" | "comment" | "resolved" | "badge"): Promise<void> {
  const notif: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    message,
    issueId,
    type,
    read: false,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      await addDoc(collection(db, "notifications"), notif);
      return;
    } catch (e) {
      console.error("Firestore createNotification failed, using local:", e);
    }
  }

  const notifs = getLocalNotifications();
  notifs.unshift(notif);
  saveLocalNotifications(notifs);
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, "notifications"), 
        where("userId", "==", userId), 
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const list: Notification[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Notification);
      });
      return list;
    } catch (e) {
      console.error("Firestore getNotifications failed, using local:", e);
    }
  }

  return getLocalNotifications()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markNotificationsAsRead(userId: string): Promise<void> {
  if (isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, "notifications"), 
        where("userId", "==", userId), 
        where("read", "==", false)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnap) => {
        await updateDoc(doc(db, "notifications", docSnap.id), { read: true });
      });
      return;
    } catch (e) {
      console.error("Firestore markNotificationsAsRead failed, using local:", e);
    }
  }

  const notifs = getLocalNotifications();
  notifs.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  saveLocalNotifications(notifs);
}

// SEED FIRESTORE (If empty on first load)
async function seedFirestore() {
  console.log("Seeding Firestore with community demo data...");
  try {
    for (const u of DEMO_USERS) {
      await setDoc(doc(db, "users", u.id), u);
    }
    for (const i of DEMO_ISSUES) {
      await setDoc(doc(db, "issues", i.id), i);
    }
    for (const c of DEMO_COMMENTS) {
      await addDoc(collection(db, "comments"), c);
    }
    console.log("Firestore successfully seeded!");
  } catch (e) {
    console.error("Error seeding Firestore:", e);
  }
}
