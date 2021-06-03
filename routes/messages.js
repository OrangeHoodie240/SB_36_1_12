const express = require('express');
const router = new express.Router(); 
const Message = require('../models/message');
const middleware = require('../middleware/auth');
const ExpressError = require('../expressError');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', middleware.ensureLoggedIn,  async (req, res, next)=>{
    const username = req.body.user.username;
    const id = req.params.id; 
    try{
        const message = await Message.get(id);
        if(username === message.from_user.username || username === message.to_user.username){
            return res.status(200).json({message});
        }
        throw new ExpressError('Unathorized', 401);
    }
    catch (err){
        return next(err);
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', middleware.ensureLoggedIn, async (req, res, next)=>{
    const {to_username, body} = req.body; 
    const from_username = req.body.user.username;
    try{
        const message = await Message.create(from_username,to_username, body);
        return res.status(201).json({message});
    }
    catch (err){
        return next(err);
    }
});


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', middleware.ensureLoggedIn, async (req, res, next)=>{
    const username = req.body.user.username; 
    const id = req.params.id; 
    try {
        const message = await Message.get(id); 
        if(message.to_user.username === username){
            await Message.markRead(id);
            return res.status(200);
        }
        else{
            throw new ExpressError('Unauthoriazed', 401);
        }
    }
    catch(err){
        return next(err);
    }
});

module.exports = router; 