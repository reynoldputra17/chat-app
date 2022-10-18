import React from 'react';
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile} from "firebase/auth";
import { auth, storage, db } from '../firebase'
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {

    const [err, setErr] = useState(false)
    const navigate = useNavigate()
    
    const switchHandle = (val) => {
        if(val == "login") {
            document.getElementById('pills-home').classList.add('active')
            document.getElementById('pills-home').classList.add('show')
            document.getElementById('pills-home-tab').classList.add('active')
            document.getElementById('pills-profile').classList.remove('active')
            document.getElementById('pills-profile').classList.remove('show')
            document.getElementById('pills-profile-tab').classList.remove('active')
        } else {
            document.getElementById('pills-home').classList.remove('active')
            document.getElementById('pills-home').classList.remove('show')
            document.getElementById('pills-home-tab').classList.remove('active')
            document.getElementById('pills-profile').classList.add('active')
            document.getElementById('pills-profile').classList.add('show')
            document.getElementById('pills-profile-tab').classList.add('active')
        }
    }
    
    const loginSubmit = async (e) => {
        e.preventDefault()
        const email = e.target[0].value
        const password = e.target[1].value
        try {
            await signInWithEmailAndPassword(auth, email, password)
            navigate('/')
        } catch (err){
            setErr(true)
        }
        
    }

    const registSubmit = async (e) => {
        e.preventDefault()
        const displayName = e.target[0].value
        const email = e.target[1].value
        const password = e.target[2].value
        const file = e.target[3].files[0]
        
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password)
            const storageRef = ref(storage, displayName);
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on(
                (error) => {
                    setErr(true)
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                        await updateProfile(res.user, {
                            displayName,
                            photoURL: downloadURL
                        })
                        await setDoc(doc(db, "users", res.user.uid), {
                            uid : res.user.uid,
                            displayName,
                            email,
                            photoURL: downloadURL
                        })
                        await setDoc(doc(db, "userChats", res.user.uid), {})
                        navigate("/")
                    });
                }
            );

        } catch (err){
            setErr(true)
        }
        
    }

    return (
        <div className="d-flex justify-content-center align-items-center mt-5">
            <Helmet>
                <link rel="stylesheet" href="../css/login.css" />
            </Helmet>
            <div className="card p-5" >
                <ul className="nav nav-pills d-flex justify-content-center align-items-center" id="pills-tab" role="tablist">
                    <li className="nav-item text-center">
                    <a onClick={() => switchHandle("login")} className="nav-link active btl" id="pills-home-tab" data-toggle="pill" role="tab" aria-controls="pills-home" aria-selected="true">Login</a>
                    </li>
                    <li className="nav-item text-center">
                    <a onClick={() => switchHandle("regist")}  className="nav-link btr" id="pills-profile-tab" data-toggle="pill"role="tab" aria-controls="pills-profile" aria-selected="false">Signup</a>
                    </li>
                </ul>
                <div className="tab-content"  id="pills-tabContent">
                    <div className="tab-pane fade show active" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab">
                        <div className="form px-4 pt-1">
                            <form onSubmit={loginSubmit}>
                                <input type="text" name="" className="form-control mt-3" placeholder="Email" />
                                <input type="password" name="" className="form-control mt-3" placeholder="Password" />
                                <button className="btn btn-dark btn-block mt-3">Login</button>
                            </form>
                        </div>
                    </div>
                    <div className="tab-pane fade" id="pills-profile" role="tabpanel" aria-labelledby="pills-profile-tab">
                        <div className="form px-4">
                            <form onSubmit={registSubmit} >
                                <input type="text" name="" className="form-control mt-3" placeholder="Name" />
                                <input type="text" name="" className="form-control mt-3" placeholder="Email" />
                                <input type="password" name="" className="form-control mt-3" placeholder="Password" />
                                <label htmlFor="formFile" className="form-label mt-3">Profile Picture</label>
                                <input className="form-control mb-3" type="file" id="formFile" />
                                {err && <span>Something went wrong</span>}
                                <button type="submit" className="btn btn-dark btn-block mt-2">Signup</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
    
}
