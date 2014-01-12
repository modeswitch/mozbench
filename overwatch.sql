PRAGMA user_version = 1;

DROP TABLE IF EXISTS browsers;
CREATE TABLE browsers (
    name VARCHAR(128) NOT NULL,

    -- URL path to installer
    path VARCHAR(1024),
    PRIMARY KEY(name)
);

DROP TABLE IF EXISTS channels;
CREATE TABLE channels (
    name VARCHAR(128),

    -- URL path to installer
    path VARCHAR(1024),
    browser VARCHAR(128),
    FOREIGN KEY (browser) REFERENCES browsers(name),
    PRIMARY KEY (name, browser)
);

DROP TABLE IF EXISTS benchmarks;
CREATE TABLE benchmarks (
    name VARCHAR(128) NOT NULL,
    version VARCHAR(64),

    -- URL path to benchmark
    path VARCHAR(1024),
    PRIMARY KEY(name, version)
);

DROP TABLE IF EXISTS devices;
CREATE TABLE devices (
    name VARCHAR(128) NOT NULL,
    os VARCHAR(128),
    cpu VARCHAR(128),
    memory VARCHAR(128),
    gpu VARCHAR(128),
    PRIMARY KEY(name)
);

DROP TABLE IF EXISTS workers;
CREATE TABLE workers (
    name VARCHAR(128) NOT NULL,
    PRIMARY KEY(name)
);

DROP TABLE IF EXISTS device_pools;
CREATE TABLE device_pools (
    worker VARCHAR(128) NOT NULL,
    device VARCHAR(128) NOT NULL,
    FOREIGN KEY (worker) REFERENCES workers(name),
    FOREIGN KEY (device) REFERENCES devices(name),
    PRIMARY KEY(worker, device)
);

DROP TABLE IF EXISTS jobs;
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device VARCHAR(128) NOT NULL,
    browser VARCHAR(128) NOT NULL,
    channel VARCHAR(128) NOT NULL,
    benchmark VARCHAR(128) NOT NULL,
    replicates INTEGER NOT NULL,
    complete BOOLEAN NOT NULL,
    FOREIGN KEY (device) REFERENCES devices(name),
    FOREIGN KEY (browser) REFERENCES browsers(name),
    FOREIGN KEY (channel) REFERENCES channels(name)
);

DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job INTEGER NOT NULL,
  FOREIGN KEY (job) REFERENCES jobs(id)
);

-- Initial settings

INSERT INTO browsers (name, path) VALUES('firefox', 'firefox');
INSERT INTO browsers (name, path) VALUES('chrome', 'chrome');

INSERT INTO channels (name, path, browser) VALUES('release', 'release', 'firefox');
INSERT INTO channels (name, path, browser) VALUES('beta', 'beta', 'firefox');
INSERT INTO channels (name, path, browser) VALUES('aurora', 'aurora', 'firefox');
INSERT INTO channels (name, path, browser) VALUES('nightly', 'nightly', 'firefox');
INSERT INTO channels (name, path, browser) VALUES('stable', 'stable', 'chrome');
INSERT INTO channels (name, path, browser) VALUES('beta', 'beta', 'chrome');
INSERT INTO channels (name, path, browser) VALUES('dev', 'dev', 'chrome');
INSERT INTO channels (name, path, browser) VALUES('canary', 'canary', 'chrome');

INSERT INTO benchmarks (name, version, path) VALUES('octane', '1.0', 'octane');
INSERT INTO benchmarks (name, version, path) VALUES('octane', '2.0', 'octane-2.0');
INSERT INTO benchmarks (name, version, path) VALUES('sunspider', '1.0', 'sunspider-1.0');
INSERT INTO benchmarks (name, version, path) VALUES('kraken', '1.1', 'kraken');
INSERT INTO benchmarks (name, version, path) VALUES('canvasmark', 'v6', 'canvasmark');