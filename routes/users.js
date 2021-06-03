const express = require('express'); 
const router = new express.Router(); 

const User = require('../models/user'); 
const middleware = require('../middleware/auth');
const ExpressError = require('../expressError');

/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', middleware.ensureLoggedIn, async (req, res, next)=>{
    const users = await User.all();
    return res.status(200).json({users});
});

/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username', middleware.ensureLoggedIn, middleware.ensureCorrectUser, async (req, res, next)=>{
    const username = req.params.username; 
    try{
        const user = await User.get(username); 
        return res.status(200).json({user});    
    }
    catch(err){
        return next(err);
    }
});

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', middleware.ensureLoggedIn, middleware.ensureCorrectUser,  async (req, res, next)=>{
    const username = req.params.username; 
    try{
        const messages = await User.messagesTo(username);
        return res.json({messages});
    }
    catch(err){
        return next(err);
    }
});

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/from', middleware.ensureLoggedIn, middleware.ensureCorrectUser,  async (req, res, next)=>{
    const username = req.params.username; 
    try {
        const messages = await User.messagesFrom(username);
        return res.json({messages});
    }
    catch (err){
        return next(err);
    }
});

module.exports = router; 