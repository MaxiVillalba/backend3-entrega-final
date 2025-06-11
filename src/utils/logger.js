import winston from 'winston';

const customLevelOptions = {
    levels: {
        fatal:0,
        error: 1,
        warning: 2,
        info: 3,
        debug: 4,
    },
    colors: {
        fatal:'red',
        error: 'red',
        warning: 'yellow',
        info: 'blue',
        debug: 'white',
    },
}

export const logger = winston.createLogger({
    levels: customLevelOptions.levels,
    transports: [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize({colors: customLevelOptions.colors}),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: './error.logs',
            level: 'warning',
            format: winston.format.simple()
        })
    ]
})

