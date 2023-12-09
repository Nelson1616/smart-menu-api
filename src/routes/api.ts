import express from 'express';
import RestaurantController from '../app/Controllers/RestaurantController';
import TableController from '../app/Controllers/TableController';
import OfficialController from '../app/Controllers/OfficialController';
const router = express.Router();

router.get('/', function(req, res) {
    res.send('welcome to api');
});

router.get('/restaurants', RestaurantController.index);

router.get('/tables/:code', TableController.showByCode);
router.post('/tables/enter/:code', TableController.enter);

router.post('/officials/login', OfficialController.login);
router.post('/officials/:id', OfficialController.show);

export default router;