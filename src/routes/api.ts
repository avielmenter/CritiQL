import { Router } from 'express';

let router = Router();

router.get('/', (req, res) => {
	res.send("API!");
});

export default router;