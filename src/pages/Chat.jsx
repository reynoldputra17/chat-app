import "../css/chat.css"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext.";
import { collection, doc, getDocs, getDoc, setDoc, where, query, updateDoc, serverTimestamp, onSnapshot, arrayUnion, Timestamp } from "firebase/firestore"; 
import { db } from "../firebase"
import { ChatContext } from "../context/ChatContext";
import { v4 as uuid } from 'uuid'

export default function Chat() {
	const {currentUser} = useContext(AuthContext) 
	const [username, setUsername] = useState("")
	const [user, setUser] = useState(null)
	const [err, setErr] = useState(false)
	const [chats, setChats] = useState([])
	const {dispatch} = useContext(ChatContext)
	const {data} = useContext(ChatContext)
	const [messages, setMessages] = useState([])
	const [text, setText] = useState("")

	useEffect(() => {
		const getChats = () => {

			const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), doc => {
				setChats(doc.data())
			});
			
			return () => {
				unsub();
			};
		};
		currentUser.uid && getChats()
	}, [currentUser.uid]);

	useEffect(() => {
		const scanpMsg = onSnapshot (doc(db, "chats", data.chatId), (doc) =>  {
			doc.exists() && setMessages(doc.data())
		})
		return () => {
			scanpMsg()
			console.log(messages)
		}
	}, [data.chatId])


	const searchUser = async () => {
		const q = query(collection(db, "users"), where("displayName", "==", username))
		try {		
			const querySnapshot = await getDocs(q)
			querySnapshot.forEach((doc) => {
				setUser(doc.data())
			})
		} catch (err){
			setErr(true)
		}
	}

	const handleSearch = e => {
		e.code === "Enter" && searchUser()
	}

	const handleSelect = async () => {	
		const combinedId = currentUser.uid > user.uid ? currentUser.uid + user.uid : user.uid + currentUser.uid
		try {
			const res = await getDoc(doc(db, "chats", combinedId))
			if(!res.exists()){
				await setDoc(doc(db, "chats", combinedId), {messages: []})
				
				await updateDoc(doc(db, "userChats", currentUser.uid),{
					[combinedId+".userInfo"]: {
						uid : user.uid,
						displayName: user.displayName,	
						photoUrl : user.photoURL
					},
					[combinedId+".date"]: serverTimestamp()
				})

				await updateDoc(doc(db, "userChats", user.uid),{
					[combinedId+".userInfo"]: {
						uid : currentUser.uid,
						displayName: currentUser.displayName,
						photoUrl : currentUser.photoURL
					},
					[combinedId+".date"]: serverTimestamp()
				})
			}
		} catch(err){} 

		setUser(null)
		setUsername(null)
	}

	const handleSelectChat = (u) => {
		dispatch({type: "CHANGE_USER", payload: u})
	}

	const handleSend = async () => {
		await updateDoc(doc(db, "chats", data.chatId), {
			messages: arrayUnion({
				id: uuid(),
				text,
				senderId : currentUser.uid,
				date: Timestamp.now()
			})
		})

		await updateDoc(doc(db, "userChats", currentUser.uid), {
			[data.chatId + ".lastMessage"]: {
				text,
				senderId : currentUser.uid
			},
			[data.chatId + ".date"]: serverTimestamp()
		})

		await updateDoc(doc(db, "userChats", data.user.uid), {
			[data.chatId + ".lastMessage"]: {
				text,
				senderId : currentUser.uid
			},
			[data.chatId + ".date"]: serverTimestamp()
		})
		
		setText("")
	}

	const convertTime = (val) => {
		const firebaseTime = new Date(
			val.seconds * 1000 + val.nanoseconds / 1000000,
		);

		return firebaseTime.toLocaleTimeString()
	}


	return (
    <div className="content">
		<div className="container p-3 mt-4">
			<div className="card">
				<div className="row g-0">
					<div className="col-12 col-lg-5 col-xl-3 border-right">
						<div className="px-4 d-none d-md-block">
							<button className="btn btn-secondary mt-3" onClick={() => signOut(auth)}>
								Logout
							</button>
							<div href="" className="list-group-item list-group-item-action border-0 px-4 py-2 mt-2 bg-primary rounded" >
								<div className="d-flex align-items-start ">
									<img src={currentUser.photoURL} className="img-avatar mr-1" />
									<strong className="flex-grow-1 px-3 py-2 text-white">
										{ currentUser.displayName }
									</strong>
								</div>
							</div>

							<div className="d-flex align-items-center">
								<div className="flex-grow-1">
									<input type="text" className="form-control mt-3" placeholder="Search..." value={username} onKeyDown={handleSearch} onChange={e => {setUsername(e.target.value)}} />
								</div>
							</div>
						</div>
						{ err && <span className="my-1">User not found</span>}
						{
							user &&
							<a onClick={handleSelect} className="list-group-item list-group-item-action border-0 px-4 my-3">
								<div className="d-flex align-items-start">
									<img src={user.photoURL} className="img-avatar mr-1" alt="Vanessa Tucker" width="40" height="40" />
									<div className="flex-grow-1 px-3 py-2 ">
										{user.displayName}
									</div>
								</div>
							</a>
						}
						<hr className="mx-4"/>
						

						<div className="list-group-item list-group-item-action border-0 px-4 my-3" >
							{
								Object.entries(chats).sort((a,b) => a[1].date - b[1].date).map((chat) => {
									return (

										<div className="d-flex align-items-start mt-3" key={chat[0]} onClick={() => handleSelectChat(chat[1].userInfo)}>
											<div className="">
												<img src={ chat[1].userInfo.photoUrl } className="img-avatar mr-1 mt-1" alt="Vanessa Tucker" width="40" height="40" />
											</div>
											<div className="flex-grow-1 px-3  ">
												<strong className="p-0 m-0">	
													{ chat[1].userInfo.displayName }
												</strong>
												{
													chat[1].lastMessage &&
													<p className="p-0 m-0">
														{ chat[1].lastMessage.text }
													</p>
												}
											</div>
										</div>
									)
								})
							}
						</div>

						<hr className="d-block d-lg-none mt-1 mb-0" />
					</div>
					<div className="col-12 col-lg-7 col-xl-9">
						<div className="py-2 px-4 border-bottom d-none d-lg-block">
							<div className="d-flex align-items-center py-1">
								<div className="position-relative">
									{data.user.photoUrl && <img src={ data.user.photoUrl} className="img-avatar mr-1" alt="Sharon Lessman" width="40" height="40" />}
								</div>
								<div className="flex-grow-1 px-3 py-2">
									{data.user.displayName && <strong> { data.user.displayName } </strong>}
								</div>
							</div>
						</div>

						<div className="position-relative">
							<div className="chat-messages p-4">
								{
									messages.messages &&
									Object.entries(messages.messages).map( ( msg ) => {
										if(msg[1].senderId == currentUser.uid){
											return (
												<div className="chat-message-right pb-4" key={msg[0]}>
													<div className="mx-3">
														<img src={currentUser.photoURL} className="img-avatar mr-1" alt="Chris Wood" width="40" height="40" />
														<div className="text-muted small text-nowrap mt-2">{ convertTime(msg[1].date) }</div>
													</div>
													<div className="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
														<strong className="font-weight-bold mb-1">You</strong><br />
														{ msg[1].text }
													</div>
												</div>
											)
										} else {
											return (
												<div className="chat-message-left pb-4" key={msg[0]}>
													<div className="mx-3">
														<img src={ data.user.photoUrl}  className="img-avatar mr-1" alt="Sharon Lessman" width="40" height="40" />
														<div className="text-muted small text-nowrap mt-2">{ convertTime(msg[1].date) }</div>
													</div>
													<div className="flex-shrink-1 bg-light rounded py-2 px-3 ml-3">
													<strong className="font-weight-bold mb-1">{ data.user.displayName } </strong><br />
													{ msg[1].text }
													</div>
												</div>
											)
										}
									})
								}
							

								
							</div>
						</div>

						<div className="flex-grow-0 py-3 px-4 border-top">
							<div className="input-group">
								<input onChange={e => setText(e.target.value)} type="text" className="form-control" placeholder="Type your message" value={text} />
								<button onClick={handleSend} className="btn btn-primary">Send</button>
							</div>
						</div>

					</div>
				</div>
			</div>
		</div>
	</div>
  );
}

