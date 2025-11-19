
/**
 * MODULE: DATABASE & LOGGING
 * Sử dụng ADODB.Stream để hỗ trợ UTF-8 chuẩn, tránh lỗi font tiếng Việt.
 */

var DB_PATH = "";
var LOG_FILE = "";

function initDB() {
    try {
        // 1. Xử lý đường dẫn (Hack não với HTA path)
        var path = document.location.pathname;
        path = decodeURI(path); 
        // Xóa dấu / ở đầu nếu có (Bug của IE trả về /C:/...)
        if (path.substring(0, 1) === "/") path = path.substring(1);
        path = path.replace(/\//g, "\\");
        
        // Lấy thư mục gốc dự án (Parent của file index.hta)
        var currentDir = fso.GetParentFolderName(path);
        
        // Thiết lập đường dẫn
        DB_PATH = fso.BuildPath(currentDir, "Database");
        LOG_FILE = fso.BuildPath(DB_PATH, "system_logs.json");

        // 2. Tạo thư mục Database nếu chưa có
        if (!fso.FolderExists(DB_PATH)) {
            fso.CreateFolder(DB_PATH);
            logSystem("DB", "Created Directory: " + DB_PATH);
        }

        // 3. Tạo file JSON rỗng nếu chưa có (Ghi UTF-8)
        if (!fso.FileExists(LOG_FILE)) {
            saveContentToFile(LOG_FILE, "[]");
            logSystem("DB", "Initialized system_logs.json");
        } else {
            logSystem("DB", "Connected to Database.");
        }

    } catch(e) {
        logSystem("DB_ERR", "Init Failed: " + e.message);
    }
}

/**
 * Ghi nội dung vào file log
 * @param {string} action - Tên hành động
 * @param {string} details - Chi tiết hành động
 */
function writeLog(action, details) {
    try {
        // 1. Đọc nội dung cũ
        var content = readContentFromFile(LOG_FILE);
        var logs = [];
        
        try {
            if (content && content.length > 0) logs = JSON.parse(content);
        } catch(ex) { logs = []; }

        // 2. Tạo object log mới
        var newLog = {
            "timestamp": new Date().toLocaleString(),
            "user": network.UserName,
            "host": network.ComputerName,
            "action": action,
            "details": details
        };
        
        // Thêm vào mảng
        logs.push(newLog);

        // 3. Ghi đè file bằng ADODB
        saveContentToFile(LOG_FILE, JSON.stringify(logs, null, 2));
        logSystem("DB_SAVE", "Logged: " + action);
        
    } catch(e) {
        logSystem("DB_ERR", "Write Failed: " + e.message);
    }
}

/**
 * Helper: Đọc file UTF-8 bằng ADODB.Stream
 */
function readContentFromFile(filePath) {
    if (!fso.FileExists(filePath)) return "";
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Open();
        stream.Type = 2; // adTypeText
        stream.Charset = "utf-8";
        stream.LoadFromFile(filePath);
        var text = stream.ReadText();
        stream.Close();
        return text;
    } catch(e) {
        return "";
    }
}

/**
 * Helper: Ghi file UTF-8 bằng ADODB.Stream
 */
function saveContentToFile(filePath, content) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Open();
        stream.Type = 2; // adTypeText
        stream.Charset = "utf-8";
        stream.WriteText(content);
        stream.SaveToFile(filePath, 2); // 2 = adSaveCreateOverWrite
        stream.Close();
        return true;
    } catch(e) {
        throw e;
    }
}
