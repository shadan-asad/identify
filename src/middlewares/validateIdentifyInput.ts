import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const schema = Joi.object({
  email: Joi.string().email(),
  phoneNumber: Joi.number().integer().positive(),
}).or("email", "phoneNumber");

export const validateIdentifyInput = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};
