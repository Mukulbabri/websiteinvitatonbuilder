import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { sendResponse } from '../utils/response.util';

export const createOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { planKey, amount } = req.body;
    const userId = req.user?.userId || 'usr-3';

    const order = await prisma.order.create({
      data: {
        userId,
        planKey: planKey.toUpperCase(),
        amount: parseFloat(amount),
        status: 'PENDING',
        razorpayOrderId: `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      },
    });

    return sendResponse(res, 201, true, 'Order created', order);
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, paymentId } = req.body;
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        razorpayPaymentId: paymentId,
      },
    });
    return sendResponse(res, 200, true, 'Payment verified successfully', updated);
  } catch (error) {
    next(error);
  }
};
