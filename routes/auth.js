const express = require('express'); 
const router = new express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');
const { user } = require('../db');
const ExpressError = require('../expressError');

const User = require('../models/user'); 

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next)=>{
    const {username, password} = req.body; 
    try {
        const valid = await User.authenticate(username, password); 
        if(valid){
            await User.updateLoginTimestamp(username);
            const token = jwt.sign({username}, config.SECRET_KEY); 
            return res.status(200).json({ token });  
        }
        else{
            throw new ExpressError('Failed Login', 400);
        }
    }
    catch(err){
        return next(err);
    }
});


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next)=>{
    const username = req.body.username;
    try{
        await User.register(req.body);
        await User.updateLoginTimestamp(username); 
        
        const token = jwt.sign({username}, config.SECRET_KEY); 
        
        return res.status(201).json({token}); 
    } 
    catch(err){
        return next(err);
    }
});

module.exports = router; 