const sgMail = require('@sendgrid/mail');
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const templates = {
	newUser: 'd-a48b00c1e9184365abec57fe4cf211f7',
	bookCreated: 'd-3bdc25b225834025b80a9c3a20ab08dd',
	newBookViaGoogle: 'd-258692b6b5f44f1a87a8877fce2d62ec ',
	resendToken: 'd-0a347cfe36a04b0bb3a5a7e4ae328319',
};
module.exports = (email, template, templateData) => {
	const msg = {
		to: email, // Change to your recipient
		from: 'heetkv@gmail.com', // Change to your verified sender
		templateId: templates[template],
		dynamic_template_data: templateData,
	};
	sgMail
		.send(msg)
		.then(() => {
			console.log('Email sent');
		})
		.catch((error) => {
			console.error(error);
		});
};
