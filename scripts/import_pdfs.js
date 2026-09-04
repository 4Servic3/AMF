"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var crypto_1 = __importDefault(require("crypto"));
var envPath = path_1.default.resolve(process.cwd(), '.env.local');
var envContent = fs_1.default.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(function (line) {
    var _a = line.split('='), key = _a[0], val = _a.slice(1);
    if (key && val.length > 0) {
        process.env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
});
var SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
var SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_KEY);
var PDF_DIR = 'C:\\Users\\Administrador\\Desktop\\AMF\\Produtos\\Imersao Clinica em Felinos\\entregaveis em pdf';
var BUCKET_NAME = 'course-materials';
function importPDFs() {
    return __awaiter(this, void 0, void 0, function () {
        var buckets, bucketExists, course, module3, lessons, files, successCount, failCount, _loop_1, _i, files_1, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('--- Iniciando Importação de PDFs ---');
                    return [4 /*yield*/, supabase.storage.listBuckets()];
                case 1:
                    buckets = (_a.sent()).data;
                    bucketExists = buckets === null || buckets === void 0 ? void 0 : buckets.find(function (b) { return b.name === BUCKET_NAME; });
                    if (!!bucketExists) return [3 /*break*/, 3];
                    console.log("Criando bucket: ".concat(BUCKET_NAME));
                    return [4 /*yield*/, supabase.storage.createBucket(BUCKET_NAME, { public: false })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    console.log("Bucket ".concat(BUCKET_NAME, " j\u00E1 existe (public: false)."));
                    _a.label = 4;
                case 4: return [4 /*yield*/, supabase
                        .from('courses')
                        .select('id, title')
                        .eq('slug', 'imersao-clinica-de-felinos-parte-1')
                        .single()];
                case 5:
                    course = (_a.sent()).data;
                    if (!course)
                        throw new Error('Curso não encontrado.');
                    return [4 /*yield*/, supabase
                            .from('course_modules')
                            .select('id, title')
                            .eq('course_id', course.id)
                            .ilike('title', '%Materiais da Aula%')
                            .single()];
                case 6:
                    module3 = (_a.sent()).data;
                    if (!module3)
                        throw new Error('Módulo 3 não encontrado.');
                    return [4 /*yield*/, supabase
                            .from('lessons')
                            .select('id, title, type')
                            .eq('module_id', module3.id)
                            .eq('type', 'pdf_material')];
                case 7:
                    lessons = (_a.sent()).data;
                    files = fs_1.default.readdirSync(PDF_DIR).filter(function (f) { return f.toLowerCase().endsWith('.pdf'); });
                    console.log("\nEncontrados ".concat(files.length, " PDFs no diret\u00F3rio local."));
                    successCount = 0;
                    failCount = 0;
                    _loop_1 = function (file) {
                        var filePath, stat, buffer, checksum, lesson, existingMaterial, uuid, storagePath, uploadError, insertError;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    filePath = path_1.default.join(PDF_DIR, file);
                                    stat = fs_1.default.statSync(filePath);
                                    buffer = fs_1.default.readFileSync(filePath);
                                    // Validate magic bytes
                                    if (buffer.toString('utf-8', 0, 4) !== '%PDF') {
                                        console.error("\u274C ".concat(file, " n\u00E3o \u00E9 um PDF v\u00E1lido."));
                                        failCount++;
                                        return [2 /*return*/, "continue"];
                                    }
                                    checksum = crypto_1.default.createHash('sha256').update(buffer).digest('hex');
                                    lesson = lessons === null || lessons === void 0 ? void 0 : lessons.find(function (l) { return l.title === file; });
                                    if (!lesson) {
                                        console.error("\u274C Lesson n\u00E3o encontrada para ".concat(file, ". (Verifique nome exato)"));
                                        failCount++;
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, supabase
                                            .from('lesson_materials')
                                            .select('id')
                                            .eq('lesson_id', lesson.id)
                                            .eq('checksum', checksum)
                                            .single()];
                                case 1:
                                    existingMaterial = (_b.sent()).data;
                                    if (existingMaterial) {
                                        console.log("\u26A0\uFE0F ".concat(file, " j\u00E1 importado (Checksum ID: ").concat(existingMaterial.id, "). Pulando..."));
                                        successCount++;
                                        return [2 /*return*/, "continue"];
                                    }
                                    uuid = crypto_1.default.randomUUID();
                                    storagePath = "".concat(course.id, "/").concat(module3.id, "/").concat(uuid, ".pdf");
                                    return [4 /*yield*/, supabase.storage
                                            .from(BUCKET_NAME)
                                            .upload(storagePath, buffer, {
                                            contentType: 'application/pdf',
                                            upsert: false
                                        })];
                                case 2:
                                    uploadError = (_b.sent()).error;
                                    if (uploadError) {
                                        console.error("\u274C Falha no upload de ".concat(file, ":"), uploadError.message);
                                        failCount++;
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, supabase
                                            .from('lesson_materials')
                                            .insert({
                                            lesson_id: lesson.id,
                                            course_id: course.id,
                                            title: file,
                                            name: file,
                                            file_url: storagePath,
                                            storage_path: storagePath,
                                            type: 'pdf',
                                            mime_type: 'application/pdf',
                                            size_bytes: stat.size,
                                            checksum: checksum,
                                            bucket_name: BUCKET_NAME,
                                            view_policy: 'private',
                                            download_policy: 'allowed',
                                            status: 'published'
                                        })];
                                case 3:
                                    insertError = (_b.sent()).error;
                                    if (insertError) {
                                        console.error("\u274C Falha ao inserir registro do material ".concat(file, ":"), insertError.message);
                                        // rollback upload?
                                        failCount++;
                                    }
                                    else {
                                        console.log("\u2705 Sucesso: ".concat(file, " importado e linkado a ").concat(lesson.id));
                                        successCount++;
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, files_1 = files;
                    _a.label = 8;
                case 8:
                    if (!(_i < files_1.length)) return [3 /*break*/, 11];
                    file = files_1[_i];
                    return [5 /*yield**/, _loop_1(file)];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 8];
                case 11:
                    console.log("\n--- Importa\u00E7\u00E3o Conclu\u00EDda ---");
                    console.log("Sucesso: ".concat(successCount));
                    console.log("Falhas: ".concat(failCount));
                    return [2 /*return*/];
            }
        });
    });
}
importPDFs().catch(console.error);
