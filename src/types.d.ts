export interface EmailTemplates {
	newUser: 'd-a48b00c1e9184365abec57fe4cf211f7';
	bookCreated: 'd-3bdc25b225834025b80a9c3a20ab08dd';
	newUserViaGoogle: 'd-258692b6b5f44f1a87a8877fce2d62ec';
	resendToken: 'd-0a347cfe36a04b0bb3a5a7e4ae328319';
}
export interface EmailAttachment {
	filename: string;
	content: string;
}
export interface NewUserEmailProps {
	type: EmailTemplates['newUser'] | EmailTemplates['resendToken'];
	name: string;
	verificationLink: string;
}
export interface bookCreated {
	type: EmailTemplates['bookCreated'];
	title: string;
	author: string;
	extension: string;
	name: string;
}
export interface User {
	userid: string;
	email: string;
	username: string;
	downloads: number;
	name: string;
}
export interface NewUserViaGoogle {
	type: EmailTemplates['newUserViaGoogle'];
	name: string;
}
