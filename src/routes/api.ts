import express from 'express';
import RestaurantController from '../app/Controllers/RestaurantController';
import TableController from '../app/Controllers/TableController';
const router = express.Router();

router.get('/', function(req, res) {
    res.send('welcome to api');
});

router.get('/restautants', RestaurantController.index);

router.get('/tables/:code', TableController.index);

export default router;