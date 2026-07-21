import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app: Application = express();

// Security & Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Dynamic CORS allowing any localhost / frontend origin
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (localhost on any port: 5173, 5174, etc., or production frontend)
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Wedding Website Custom Express Backend API Running' });
});

app.use('/api/v1', apiRoutes);

// Central Error Handler
app.use(errorHandler);

export default app;
