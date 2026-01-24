import { Router } from "express";
import { createTransactionController } from "../controllers/transaction.controller";


const transactionRoutes = Router();

transactionRoutes.get("/create",createTransactionController);

export default transactionRoutes;