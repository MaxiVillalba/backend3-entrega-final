import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import mocksRouter from './routes/mocks.router.js';
import dotenv from 'dotenv'

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'publlic'))

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use ('/api/mocks', mocksRouter);

app.get('/', (req, res) => {
    res.render('home');
})

export default app;