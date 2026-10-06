// Centralized config — fullstack-dev §2
export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
  },
  // ponytail: add db, jwt, s3 config when ready
};

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';
