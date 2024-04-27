import {
	Client,
	Account,
	ID,
	Avatars,
	Databases,
	Query,
	Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
	endpoint: "https://cloud.appwrite.io/v1",
	platform: "com.fairfield.aora",
	projectId: "6628524755328e4cc475",
	databaseId: "66285369d56e5dd6474c",
	userCollectionId: "66285381b3e623260fcf",
	videoCollectionId: "66285397eab2069118e8",
	storageId: "662854a7022db429c841",
};

// Init your react-native SDK
const client = new Client();

client
	.setEndpoint(appwriteConfig.endpoint) // Your Appwrite Endpoint
	.setProject(appwriteConfig.projectId) // Your project ID
	.setPlatform(appwriteConfig.platform); // Your application ID or bundle ID.

const account = new Account(client);
const avatar = new Avatars(client);
const db = new Databases(client);
const storage = new Storage(client);

// Register User

export const createUser = async (email, password, username) => {
	try {
		const newAccount = await account.create(
			ID.unique(),
			email,
			password,
			username
		);
		if (!newAccount) throw Error;
		const avatarUrl = avatar.getInitials(username);

		await signIn(email, password);
		const newUser = await db.createDocument(
			appwriteConfig.databaseId,
			appwriteConfig.userCollectionId,
			ID.unique(),
			{
				accountId: newAccount.$id,
				email,
				username,
				avatar: avatarUrl,
			}
		);
		return newUser;
	} catch (error) {
		console.log(error);
		throw new Error(error);
	}
};

export const signIn = async (email, password) => {
	try {
		const session = await account.createEmailSession(email, password);
		return session;
	} catch (error) {
		throw new Error(error);
	}
};

export const getCurrentUser = async () => {
	try {
		const currentAccount = await account.get();
		if (!currentAccount) throw Error;
		const currentUser = await db.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.userCollectionId,
			[Query.equal("accountId", currentAccount.$id)]
		);
		if (!currentUser) throw Error;
		return currentUser.documents[0];
	} catch (error) {
		console.log(error);
	}
};

export const getAllPosts = async () => {
	try {
		const posts = await db.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.videoCollectionId
		);
		return posts.documents;
	} catch (error) {
		throw new Error(error);
	}
};

export const getLatestPosts = async () => {
	try {
		const posts = await db.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.videoCollectionId,
			[Query.orderDesc("$createdAt", Query.limit(7))]
		);
		return posts.documents;
	} catch (error) {
		throw new Error(error + "att");
	}
};

export const searchPosts = async (query) => {
	try {
		const posts = await db.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.videoCollectionId,
			[Query.search("title", query)]
		);
		return posts.documents;
	} catch (error) {
		throw new Error(error);
	}
};

export const getUserPosts = async (userId) => {
	try {
		const posts = await db.listDocuments(
			appwriteConfig.databaseId,
			appwriteConfig.videoCollectionId,
			[Query.equal("creator", userId)]
		);
		return posts.documents;
	} catch (error) {
		throw new Error(error);
	}
};

export const signOut = async () => {
	try {
		const session = await account.deleteSession("current");
		return session;
	} catch (error) {
		throw new Error(error);
	}
};

export async function getFilePreview(fileId, type) {
	let fileUrl;

	try {
		if (type === "video") {
			fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
		} else if (type === "image") {
			fileUrl = storage.getFilePreview(
				appwriteConfig.storageId,
				fileId,
				2000,
				2000,
				"top",
				100
			);
		} else {
			throw new Error("Invalid file type");
		}

		if (!fileUrl) throw Error;

		return fileUrl;
	} catch (error) {
		throw new Error(error);
	}
}

export const uploadFile = async (file, type) => {
	if (!file) return;

	const asset = {
		name: file.fileName,
		type: file.mimeType,
		size: file.fileSize,
		uri: file.uri,
	};

	try {
		const uploadedFile = await storage.createFile(
			appwriteConfig.storageId,
			ID.unique(),
			asset
		);

		const fileUrl = await getFilePreview(uploadedFile.$id, type);
		return fileUrl;
	} catch (error) {
		throw new Error(error);
	}
};

export async function createVideoPost(form) {
	try {
		const [thumbnailUrl, videoUrl] = await Promise.all([
			uploadFile(form.thumbnail, "image"),
			uploadFile(form.video, "video"),
		]);
		const newPost = await databases.createDocument(
			appwriteConfig.databaseId,
			appwriteConfig.videoCollectionId,
			ID.unique(),
			{
				title: form.title,
				thumbnail: thumbnailUrl,
				video: videoUrl,
				prompt: form.prompt,
				creator: form.userId,
			}
		);

		return newPost;
	} catch (error) {
		throw new Error(error);
	}
}
