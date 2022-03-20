const fs = require('fs');
const logger = new NIL.Logger('FileSystem');
const path = require('path');
/**
 * 读取文件内容
 * @param {String} path 文件路径 
 */
function readFrom(path, encoding = 'utf8') {
    try {
        return fs.readFileSync(path, { encoding });
    } catch (err) {
        logger.error(err);
        return '';
    }
}

function WriteTo(path, data, encoding = 'utf8') {
    try {
        fs.writeFileSync(path, data, { encoding });
    } catch (err) {
        logger.error(err);
        return '';
    }
}

function createDir(dir) {
    try {
        fs.mkdirSync(dir, { recursive: true });
        return true;
    } catch (err) {
        logger.error(err);
        return false;
    }
}

function deleteFile(path) {
    try {
        fs.unlinkSync(path);
        return true;
    } catch (err) {
        logger.error(err);
        return false;
    }
}

/**
 * 
 * @param {String} path 文件路径 
 * @returns 是否存在
 */
function exists(path) {
    try {
        fs.statSync(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * 获取文件夹下的文件、文件夹
 * @param {String} p 路径
 * @returns 文件、文件夹列表
 */
function getFilesList(p) {
    if (exists(p) == false) {
        logger.warn(`no such dir named ${path} !!`);
        return [];
    }
    try {
        let lists = fs.readdirSync(p);;
        let rt = {};
        lists.forEach(name => {
            let option = fs.statSync(path.join(p, name));
            rt[name] = option;
        });
        return rt;
    } catch (err) {
        logger.error(err);
        return [];
    }
}

NIL.IO = { 
    readFrom, 
    WriteTo, 
    createDir, 
    delete: deleteFile, 
    exists, 
    getFilesList 
};