import { firebaseConfig } from '../../firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  collection,
  deleteDoc,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
const knownBoardsByUser = new Map();

await setPersistence(auth, browserLocalPersistence);

export function observeAuth(callback, onError) {
  return onAuthStateChanged(auth, callback, onError);
}

export function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logout() {
  return signOut(auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function watchBoards(uid, onBoards, onError) {
  const boardsRef = collection(db, 'users', uid, 'todos');
  return onSnapshot(boardsRef, { includeMetadataChanges: true }, (snapshot) => {
    const boards = snapshot.docs.map((boardDoc) => {
      const data = boardDoc.data();
      const { text, done, ...board } = data;
      return { ...board, id: boardDoc.id };
    });
    knownBoardsByUser.set(uid, new Map(boards.map((board) => [board.id, serializeBoard(board)])));
    onBoards(boards, {
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites
    });
  }, onError);
}

export async function syncBoards(uid, boards) {
  const knownBoards = knownBoardsByUser.get(uid);
  if (!knownBoards) return;

  const nextBoards = new Map(boards.map((board) => [board.id, board]));
  const boardsRef = collection(db, 'users', uid, 'todos');
  const writes = [];

  for (const board of boards) {
    const serialized = serializeBoard(board);
    if (knownBoards.get(board.id) === serialized) continue;

    const tasks = (board.sections || []).flatMap((section) => section.tasks || []);
    const boardData = {
      ...board,
      text: typeof board.title === 'string' ? board.title : '',
      done: tasks.length > 0 && tasks.every((task) => task.crossedOut === true),
      createdAt: Number(board.createdAt) || Date.now(),
      updatedAt: Number(board.updatedAt) || Date.now()
    };
    writes.push(setDoc(doc(boardsRef, board.id), boardData).then(() => {
      knownBoards.set(board.id, serialized);
    }));
  }

  for (const boardId of knownBoards.keys()) {
    if (!nextBoards.has(boardId)) {
      writes.push(deleteDoc(doc(boardsRef, boardId)).then(() => {
        knownBoards.delete(boardId);
      }));
    }
  }

  await Promise.all(writes);
}

function serializeBoard(board) {
  return JSON.stringify(board);
}
