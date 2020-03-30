import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

export const app = express();

// enable cross origin resource sharing
app.use(cors());

app.use(helmet());
