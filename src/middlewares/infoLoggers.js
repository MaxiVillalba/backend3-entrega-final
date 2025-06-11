import { request, response } from "express";
import { logger } from "../utils/logger.js";

export const addLogger = ( req = request, res= response, next) => {
    req.logger = logger 
    logger.info(`${req.method} en ${req.url} - ${new Date().toLocaleString()}`)
	next()
}