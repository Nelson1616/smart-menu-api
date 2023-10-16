import express from 'express';
import RestauratsController from '../app/Controllers/RestaurantsController';
const router = express.Router();

router.get('/', function(req, res) {
    res.send('welcome to api');
});

router.get('/restautants', RestauratsController.index);

export default router;