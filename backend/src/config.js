const parseNumber = (value, fallback, name) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: ${value}`);
  }
  return parsed;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }
  throw new Error(`Invalid boolean value: ${value}`);
};

const requiredWhenMysqlEnabled = (value, name) => {
  if (!value || String(value).trim() === '') {
    throw new Error(`Missing required setting: ${name}`);
  }
  return String(value).trim();
};

export const loadConfig = () => {
  const port = parseNumber(process.env.PORT, 5175, 'PORT');
  const mysqlEnabled = parseBoolean(process.env.MYSQL_ENABLED, false);

  const mysql = {
    enabled: mysqlEnabled,
    host: String(process.env.MYSQL_HOST || '127.0.0.1'),
    port: parseNumber(process.env.MYSQL_PORT, 3306, 'MYSQL_PORT'),
    user: String(process.env.MYSQL_USER || 'root'),
    password: String(process.env.MYSQL_PASSWORD || ''),
    database: String(process.env.MYSQL_DATABASE || 'medirescue'),
    poolSize: parseNumber(process.env.MYSQL_POOL_SIZE, 10, 'MYSQL_POOL_SIZE'),
  };

  if (port <= 0 || port > 65535) {
    throw new Error(`PORT must be between 1 and 65535. Received: ${port}`);
  }

  if (mysql.poolSize <= 0) {
    throw new Error(`MYSQL_POOL_SIZE must be > 0. Received: ${mysql.poolSize}`);
  }

  if (mysql.enabled) {
    mysql.host = requiredWhenMysqlEnabled(mysql.host, 'MYSQL_HOST');
    mysql.user = requiredWhenMysqlEnabled(mysql.user, 'MYSQL_USER');
    mysql.database = requiredWhenMysqlEnabled(mysql.database, 'MYSQL_DATABASE');
  }

  return {
    server: {
      port,
    },
    mysql,
    jobs: {
      alertTickMs: 1000,
      alertGenerateMs: 60_000,
    },
  };
};
