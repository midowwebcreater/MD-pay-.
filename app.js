import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc, setDoc, getDoc, updateDoc,
  addDoc, collection, onSnapshot,
  query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* AUTH */
window.signup = async () => {
  const email = emailInput.value;
  const pass = passInput.value;
  const ref = refInput.value;

  const res = await createUserWithEmailAndPassword(auth,email,pass);

  await setDoc(doc(db,"users",res.user.uid),{
    email,
    balance:0,
    role:"user",
    referrer:ref || null
  });

  alert("Signup done");
};

window.login = async () => {
  const res = await signInWithEmailAndPassword(auth,emailInput.value,passInput.value);

  const snap = await getDoc(doc(db,"users",res.user.uid));

  if(snap.data().role==="admin"){
    location="admin.html";
  }else{
    document.getElementById("auth").style.display="none";
    document.getElementById("app").style.display="block";
  }
};

window.logout = async ()=>{
  await signOut(auth);
  location.reload();
};

/* USER INIT */
window.initUser = ()=>{
  onAuthStateChanged(auth,user=>{
    if(!user)return;

    uid.innerText=user.uid;
    uid2.innerText=user.uid;

    onSnapshot(doc(db,"users",user.uid),(snap)=>{
      bal.innerText=snap.data().balance;
    });

    loadProgress(user.uid);
  });
};

/* BUY FLOW */
window.startBuy=()=>{
  localStorage.setItem("payAmt",buyAmt.value);
  go("payment");
};

window.submitDeposit=async ()=>{
  await addDoc(collection(db,"deposits"),{
    userId:auth.currentUser.uid,
    amount:Number(localStorage.getItem("payAmt")),
    utr:utrInput.value,
    status:"pending"
  });

  alert("Submitted");
  go("wallet");
};

/* PROGRESS */
function loadProgress(uid){
  const q=query(collection(db,"deposits"),where("userId","==",uid));

  onSnapshot(q,(snap)=>{
    let html="";
    snap.forEach(d=>{
      html+=`<div class="card">₹${d.data().amount} - ${d.data().status}</div>`;
    });
    progressList.innerHTML=html;
  });
}

/* WITHDRAW */
window.submitWithdraw=async ()=>{
  await addDoc(collection(db,"withdraw"),{
    userId:auth.currentUser.uid,
    amount:Number(wAmt.value),
    status:"pending"
  });

  alert("Requested");
};

/* ADMIN */
window.loadAdmin=()=>{
  onSnapshot(collection(db,"deposits"),snap=>{
    let html="";
    snap.forEach(d=>{
      let x=d.data();
      if(x.status==="pending"){
        html+=`
        <div class="card">
        ₹${x.amount}
        <button onclick="approve('${d.id}','${x.userId}',${x.amount})">Approve</button>
        </div>`;
      }
    });
    deposits.innerHTML=html;
  });
};

window.approve=async(id,uid,amt)=>{
  const ref=doc(db,"users",uid);
  const snap=await getDoc(ref);

  await updateDoc(ref,{
    balance:snap.data().balance+amt
  });

  await updateDoc(doc(db,"deposits",id),{status:"approved"});
};
