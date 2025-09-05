#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AgentCommandType: () => AgentCommandType,
  AgentError: () => AgentError,
  AgentStatus: () => AgentStatus,
  AgentType: () => AgentType,
  CodebaseAnalysisError: () => CodebaseAnalysisError,
  CodebaseAnalyzer: () => CodebaseAnalyzer,
  GitError: () => GitError,
  IntelligentRulesGenerator: () => IntelligentRulesGenerator,
  MCPError: () => MCPError,
  MCPIntegrationService: () => MCPIntegrationService,
  ProjectType: () => ProjectType,
  RulesGenerationError: () => RulesGenerationError,
  SessionError: () => SessionError,
  SessionStatus: () => SessionStatus,
  TaskStatus: () => TaskStatus,
  TazzError: () => TazzError,
  ValidationError: () => ValidationError,
  main: () => main
});
module.exports = __toCommonJS(index_exports);
var import_commander11 = require("commander");
var import_chalk13 = __toESM(require("chalk"));

// src/utils/logger.ts
var import_winston = __toESM(require("winston"));

// src/utils/paths.ts
var import_path = require("path");
function getTazzDir() {
  return "/tmp/tazz-tmp";
}
function getLogsDir() {
  return (0, import_path.join)(getTazzDir(), "logs");
}
function getProjectTazzDir(projectPath) {
  const projectName = projectPath.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return (0, import_path.join)(getTazzDir(), "projects", projectName);
}
function getTazzLogPath() {
  return (0, import_path.join)(getLogsDir(), "tazz.log");
}

// src/utils/logger.ts
var Logger = class _Logger {
  winston;
  config;
  constructor(config = {}) {
    this.config = {
      level: "info",
      logFile: getTazzLogPath(),
      enableConsole: true,
      enableFile: true,
      ...config
    };
    this.winston = import_winston.default.createLogger({
      level: this.config.level,
      format: import_winston.default.format.combine(
        import_winston.default.format.timestamp(),
        import_winston.default.format.errors({ stack: true }),
        import_winston.default.format.json()
      ),
      transports: this.createTransports()
    });
  }
  createTransports() {
    const transports = [];
    if (this.config.enableConsole) {
      transports.push(
        new import_winston.default.transports.Console({
          format: import_winston.default.format.combine(
            import_winston.default.format.colorize(),
            import_winston.default.format.simple(),
            import_winston.default.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          )
        })
      );
    }
    if (this.config.enableFile) {
      transports.push(
        new import_winston.default.transports.File({
          filename: this.config.logFile,
          maxsize: 5242880,
          // 5MB
          maxFiles: 5,
          format: import_winston.default.format.combine(
            import_winston.default.format.timestamp(),
            import_winston.default.format.json()
          )
        })
      );
    }
    return transports;
  }
  error(message, error, context) {
    this.winston.error(message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : void 0,
      ...context,
      pid: process.pid
    });
  }
  warn(message, context) {
    this.winston.warn(message, {
      ...context,
      pid: process.pid
    });
  }
  info(message, context) {
    this.winston.info(message, {
      ...context,
      pid: process.pid
    });
  }
  debug(message, context) {
    this.winston.debug(message, {
      ...context,
      pid: process.pid
    });
  }
  /**
   * Create a child logger with persistent context
   */
  child(context) {
    const childLogger = new _Logger(this.config);
    const originalWinston = childLogger.winston;
    childLogger.winston = originalWinston.child(context);
    return childLogger;
  }
  /**
   * Set log level dynamically
   */
  setLevel(level) {
    this.winston.level = level;
    this.config.level = level;
  }
  /**
   * Get current log level
   */
  getLevel() {
    return this.config.level;
  }
};
var defaultLogger = null;
function getLogger(config) {
  if (!defaultLogger) {
    defaultLogger = new Logger(config);
  }
  return defaultLogger;
}

// src/cli/commands/make.ts
var import_commander = require("commander");
var import_chalk = __toESM(require("chalk"));
var import_ora = __toESM(require("ora"));
var import_fs_extra4 = require("fs-extra");
var import_path5 = require("path");

// src/core/services/MCPIntegrationService.ts
var import_fs_extra = require("fs-extra");
var import_path2 = require("path");
var import_os = require("os");
var import_execa = require("execa");

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
var NEVER = INVALID;

// src/core/types/index.ts
var SessionStatus = /* @__PURE__ */ ((SessionStatus2) => {
  SessionStatus2["ACTIVE"] = "active";
  SessionStatus2["STOPPED"] = "stopped";
  SessionStatus2["FAILED"] = "failed";
  SessionStatus2["PAUSED"] = "paused";
  return SessionStatus2;
})(SessionStatus || {});
var AgentType = /* @__PURE__ */ ((AgentType2) => {
  AgentType2["CLAUDE"] = "claude";
  AgentType2["MCP"] = "mcp";
  AgentType2["CUSTOM"] = "custom";
  return AgentType2;
})(AgentType || {});
var AgentStatus = /* @__PURE__ */ ((AgentStatus2) => {
  AgentStatus2["RUNNING"] = "running";
  AgentStatus2["STOPPED"] = "stopped";
  AgentStatus2["ERROR"] = "error";
  AgentStatus2["STARTING"] = "starting";
  return AgentStatus2;
})(AgentStatus || {});
var TaskStatus = /* @__PURE__ */ ((TaskStatus2) => {
  TaskStatus2["TODO"] = "todo";
  TaskStatus2["IN_PROGRESS"] = "in_progress";
  TaskStatus2["BLOCKED"] = "blocked";
  TaskStatus2["COMPLETED"] = "completed";
  TaskStatus2["CANCELLED"] = "cancelled";
  return TaskStatus2;
})(TaskStatus || {});
var AgentCommandType = /* @__PURE__ */ ((AgentCommandType2) => {
  AgentCommandType2["START_SESSION"] = "start_session";
  AgentCommandType2["ATTACH_SESSION"] = "attach_session";
  AgentCommandType2["RUN_TASK"] = "run_task";
  AgentCommandType2["UPDATE_TODO"] = "update_todo";
  AgentCommandType2["SPAWN_AGENT"] = "spawn_agent";
  AgentCommandType2["PARALLEL_RUN"] = "parallel_run";
  AgentCommandType2["ANALYZE_CODE"] = "analyze_code";
  AgentCommandType2["GENERATE_TESTS"] = "generate_tests";
  return AgentCommandType2;
})(AgentCommandType || {});
var ProjectType = /* @__PURE__ */ ((ProjectType2) => {
  ProjectType2["FRONTEND"] = "frontend";
  ProjectType2["BACKEND"] = "backend";
  ProjectType2["FULLSTACK"] = "fullstack";
  ProjectType2["LIBRARY"] = "library";
  ProjectType2["MOBILE"] = "mobile";
  ProjectType2["MONOREPO"] = "monorepo";
  return ProjectType2;
})(ProjectType || {});
var TazzError = class extends Error {
  constructor(message, context, cause) {
    super(message);
    this.context = context;
    this.cause = cause;
    this.name = this.constructor.name;
  }
};
var SessionError = class extends TazzError {
  code = "SESSION_ERROR";
  severity = "high";
};
var GitError = class extends TazzError {
  code = "GIT_ERROR";
  severity = "medium";
};
var AgentError = class extends TazzError {
  code = "AGENT_ERROR";
  severity = "high";
};
var MCPError = class extends TazzError {
  code = "MCP_ERROR";
  severity = "medium";
};
var ValidationError = class extends TazzError {
  code = "VALIDATION_ERROR";
  severity = "low";
};

// src/core/services/MCPIntegrationService.ts
var MCPServerSchema = external_exports.object({
  command: external_exports.string(),
  args: external_exports.array(external_exports.string()),
  env: external_exports.record(external_exports.string()).optional().default({}),
  autoApprove: external_exports.array(external_exports.string()).optional().default([]),
  disabled: external_exports.boolean().optional().default(false),
  timeout: external_exports.number().optional().default(60),
  transportType: external_exports.enum(["stdio", "sse"]).optional().default("stdio")
});
var ClaudeConfigSchema = external_exports.object({
  mcpServers: external_exports.record(MCPServerSchema).optional().default({}),
  globalShortcuts: external_exports.object({
    toggle: external_exports.string().optional()
  }).optional(),
  statusLine: external_exports.object({
    enabled: external_exports.boolean().optional(),
    position: external_exports.enum(["left", "right"]).optional()
  }).optional()
});
var MCPIntegrationService = class {
  logger;
  mcpConfig = null;
  connectedServers = /* @__PURE__ */ new Map();
  constructor(logger3) {
    this.logger = logger3;
  }
  /**
   * Detect and load MCP configuration from Claude Code settings
   */
  async detectAndSetupMCPs() {
    this.logger.info("Detecting MCP servers from Claude Code configuration");
    try {
      const claudeConfig = await this.readClaudeConfig();
      const relevantMCPs = this.filterRelevantMCPs(claudeConfig.mcpServers);
      this.mcpConfig = this.categorizeServers(relevantMCPs);
      await this.testConnections();
      this.logger.info("MCP configuration loaded successfully", {
        serversFound: Object.keys(relevantMCPs).length,
        serversActive: this.connectedServers.size
      });
      return this.mcpConfig;
    } catch (error) {
      this.logger.error("Failed to setup MCP integration", error);
      throw new MCPError("MCP setup failed", { error: error.message }, error);
    }
  }
  /**
   * Read Claude Code configuration from multiple possible locations
   */
  async readClaudeConfig() {
    const possiblePaths = [
      (0, import_path2.join)((0, import_os.homedir)(), ".claude", "settings.json"),
      (0, import_path2.join)(process.cwd(), ".claude", "settings.json"),
      (0, import_path2.join)((0, import_os.homedir)(), ".config", "claude", "settings.json")
    ];
    for (const configPath of possiblePaths) {
      try {
        const configContent = await (0, import_fs_extra.readFile)(configPath, "utf-8");
        const rawConfig = JSON.parse(configContent);
        return ClaudeConfigSchema.parse(rawConfig);
      } catch (error) {
        this.logger.debug(`Claude config not found at ${configPath}`);
        continue;
      }
    }
    throw new MCPError("No Claude Code configuration found", {
      searchPaths: possiblePaths
    });
  }
  /**
   * Filter MCP servers that are relevant to Tazz functionality
   */
  filterRelevantMCPs(mcpServers) {
    const tazzRelevantServers = [
      "git",
      "github",
      "atlassian",
      "sonarcloud",
      "playwright",
      "sequential-thinking",
      "claude-task-master",
      "fetch",
      "figma",
      "context7"
    ];
    const filtered = Object.fromEntries(
      Object.entries(mcpServers).filter(([name]) => tazzRelevantServers.includes(name)).filter(([, config]) => !config.disabled)
    );
    this.logger.debug("Filtered relevant MCP servers", {
      total: Object.keys(mcpServers).length,
      relevant: Object.keys(filtered).length,
      servers: Object.keys(filtered)
    });
    return filtered;
  }
  /**
   * Categorize servers by their functionality for Tazz
   */
  categorizeServers(servers) {
    return {
      codeAnalysis: {
        git: servers.git,
        sonarcloud: servers.sonarcloud,
        fetch: servers.fetch
      },
      projectManagement: {
        atlassian: servers.atlassian,
        github: servers.github
      },
      testing: {
        playwright: servers.playwright,
        sequentialThinking: servers["sequential-thinking"]
      },
      taskManagement: {
        claudeTaskMaster: servers["claude-task-master"]
      }
    };
  }
  /**
   * Test connections to all available MCP servers
   */
  async testConnections() {
    if (!this.mcpConfig) return;
    const allServers = this.getAllServers();
    const connectionPromises = Object.entries(allServers).map(
      async ([name, server]) => {
        try {
          await this.testServerConnection(name, server);
          this.connectedServers.set(name, server);
          this.logger.debug(`MCP server ${name} connected successfully`);
        } catch (error) {
          this.logger.warn(`Failed to connect to MCP server ${name}`, { error: error.message });
        }
      }
    );
    await Promise.all(connectionPromises);
  }
  /**
   * Test connection to a specific MCP server
   */
  async testServerConnection(name, server) {
    try {
      const { stdout } = await (0, import_execa.execa)(server.command, server.args, {
        env: { ...process.env, ...server.env },
        timeout: server.timeout * 1e3,
        input: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
              name: "tazz-cli",
              version: "1.0.0"
            }
          }
        })
      });
      const response = JSON.parse(stdout);
      if (response.error) {
        throw new Error(`Server error: ${response.error.message}`);
      }
    } catch (error) {
      throw new MCPError(`Failed to connect to ${name}`, {
        server: name,
        command: server.command,
        args: server.args
      }, error);
    }
  }
  /**
   * Call an MCP server with a specific method and parameters
   */
  async callMCP(serverName, method, params = {}) {
    const server = this.connectedServers.get(serverName);
    if (!server) {
      throw new MCPError(`MCP server ${serverName} not available`, {
        availableServers: Array.from(this.connectedServers.keys())
      });
    }
    try {
      const requestId = Date.now();
      const request = {
        jsonrpc: "2.0",
        id: requestId,
        method,
        params
      };
      this.logger.debug(`Calling MCP server ${serverName}`, { method, params });
      const { stdout } = await (0, import_execa.execa)(server.command, server.args, {
        env: { ...process.env, ...server.env },
        timeout: server.timeout * 1e3,
        input: JSON.stringify(request)
      });
      const response = JSON.parse(stdout);
      if (response.error) {
        throw new MCPError(`MCP call failed: ${response.error.message}`, {
          server: serverName,
          method,
          error: response.error
        });
      }
      this.logger.debug(`MCP call successful`, { server: serverName, method });
      return response.result;
    } catch (error) {
      this.logger.error(`MCP call failed`, error, { server: serverName, method });
      throw new MCPError(`Failed to call ${serverName}.${method}`, {
        server: serverName,
        method,
        params
      }, error);
    }
  }
  /**
   * Check if a specific MCP server is available and connected
   */
  isAvailable(serverName) {
    return this.connectedServers.has(serverName);
  }
  /**
   * Get all connected servers
   */
  getConnectedServers() {
    return Array.from(this.connectedServers.keys());
  }
  /**
   * Get MCP configuration
   */
  getConfiguration() {
    return this.mcpConfig;
  }
  /**
   * Helper to get all servers from categorized configuration
   */
  getAllServers() {
    if (!this.mcpConfig) return {};
    const allServers = {};
    Object.values(this.mcpConfig).forEach((category) => {
      Object.entries(category).forEach(([key, server]) => {
        if (server) {
          allServers[key] = server;
        }
      });
    });
    return allServers;
  }
  /**
   * Setup project-specific MCP configuration
   */
  async setupProjectSpecific(projectPath) {
    try {
      const defaultBranch = await this.detectDefaultBranch(projectPath);
      this.logger.info("Project-specific MCP configuration prepared", {
        projectPath,
        connectedServers: Array.from(this.connectedServers.keys()),
        defaultBranch
      });
    } catch (error) {
      this.logger.error("Failed to setup project MCP configuration", error);
      throw new MCPError("Failed to setup project-specific MCP configuration", {
        projectPath
      }, error);
    }
  }
  /**
   * Detect default branch for git repository
   */
  async detectDefaultBranch(projectPath) {
    try {
      if (this.isAvailable("git")) {
        const result = await this.callMCP("git", "get_default_branch", {
          repository: projectPath
        });
        return result.branch || "main";
      }
      const { stdout } = await (0, import_execa.execa)("git", ["symbolic-ref", "refs/remotes/origin/HEAD"], {
        cwd: projectPath
      });
      return stdout.replace("refs/remotes/origin/", "");
    } catch {
      return "main";
    }
  }
  /**
   * Helper to write files (for testing purposes)
   */
  async writeFile(path, content) {
    await (0, import_fs_extra.ensureFile)(path);
    await (0, import_fs_extra.writeFile)(path, content, "utf-8");
  }
};

// src/core/services/CodebaseAnalyzer.ts
var import_fs_extra2 = require("fs-extra");
var import_path3 = require("path");
var import_glob = require("glob");
var CodebaseAnalysisError = class extends TazzError {
  code = "CODEBASE_ANALYSIS_ERROR";
  severity = "medium";
};
var CodebaseAnalyzer = class {
  logger;
  mcpService;
  projectPath;
  constructor(mcpService, logger3, projectPath = process.cwd()) {
    this.mcpService = mcpService;
    this.logger = logger3;
    this.projectPath = projectPath;
  }
  /**
   * Main analysis method - orchestrates all analysis steps
   */
  async analyzeProject() {
    this.logger.info("Starting comprehensive codebase analysis", { projectPath: this.projectPath });
    try {
      const [
        structure,
        technologies,
        patterns,
        quality,
        dependencies,
        testingStrategy
      ] = await Promise.all([
        this.analyzeProjectStructure(),
        this.detectTechnologies(),
        this.extractCodePatterns(),
        this.runQualityAnalysis(),
        this.analyzeDependencies(),
        this.analyzeExistingTests()
      ]);
      const analysis = {
        structure,
        technologies,
        patterns,
        quality,
        dependencies,
        testingStrategy
      };
      await this.saveAnalysis(analysis);
      this.logger.info("Codebase analysis completed", {
        projectType: structure.type,
        language: technologies.language,
        framework: technologies.framework,
        hasTests: testingStrategy.hasTests
      });
      return analysis;
    } catch (error) {
      this.logger.error("Codebase analysis failed", error);
      throw new CodebaseAnalysisError("Failed to analyze codebase", {
        projectPath: this.projectPath
      });
    }
  }
  /**
   * Analyze project structure and organization
   */
  async analyzeProjectStructure() {
    this.logger.debug("Analyzing project structure");
    let allFiles = [];
    if (this.mcpService.isAvailable("git")) {
      try {
        const gitFiles = await this.mcpService.callMCP("git", "list_files", {
          repository: this.projectPath
        });
        allFiles = gitFiles.files || [];
      } catch (error) {
        this.logger.warn("Git MCP failed, falling back to filesystem scan");
        allFiles = await this.scanFilesystem();
      }
    } else {
      allFiles = await this.scanFilesystem();
    }
    const structure = {
      type: this.detectProjectType(allFiles),
      sourceDirectories: this.findSourceDirectories(allFiles),
      testDirectories: this.findTestDirectories(allFiles),
      configFiles: this.findConfigFiles(allFiles),
      buildTools: this.detectBuildTools(allFiles),
      hasAPI: this.detectAPI(allFiles),
      hasFrontend: this.detectFrontend(allFiles),
      baseURL: await this.detectBaseURL()
    };
    return structure;
  }
  /**
   * Scan filesystem when git MCP is not available
   */
  async scanFilesystem() {
    const patterns = [
      "**/*.{js,ts,jsx,tsx,py,go,rs,java,php,rb}",
      "**/package.json",
      "**/requirements.txt",
      "**/Cargo.toml",
      "**/go.mod",
      "**/*.config.{js,ts,json}",
      "**/test/**/*",
      "**/tests/**/*",
      "**/*.test.*",
      "**/*.spec.*"
    ];
    const files = await (0, import_glob.glob)(patterns, {
      cwd: this.projectPath,
      ignore: ["node_modules/**", "dist/**", "build/**", ".git/**"]
    });
    return files;
  }
  /**
   * Detect project type based on files and structure
   */
  detectProjectType(files) {
    const hasPackageJson = files.some((f) => f.includes("package.json"));
    const hasIndexHtml = files.some((f) => f.includes("index.html"));
    const hasReactFiles = files.some((f) => f.includes(".jsx") || f.includes(".tsx"));
    const hasServerFiles = files.some((f) => f.includes("server") || f.includes("api"));
    const hasPyFiles = files.some((f) => f.endsWith(".py"));
    const hasGoFiles = files.some((f) => f.endsWith(".go"));
    const hasMultiplePackageJsons = files.filter((f) => f.includes("package.json")).length > 1;
    if (hasMultiplePackageJsons) return "monorepo" /* MONOREPO */;
    if (hasReactFiles && hasServerFiles) return "fullstack" /* FULLSTACK */;
    if (hasIndexHtml || hasReactFiles) return "frontend" /* FRONTEND */;
    if (hasServerFiles || hasPyFiles || hasGoFiles) return "backend" /* BACKEND */;
    if (hasPackageJson && !hasIndexHtml) return "library" /* LIBRARY */;
    return "backend" /* BACKEND */;
  }
  /**
   * Find source code directories
   */
  findSourceDirectories(files) {
    const commonSrcDirs = ["src", "lib", "app", "components", "pages", "routes"];
    const foundDirs = /* @__PURE__ */ new Set();
    files.forEach((file) => {
      const parts = file.split("/");
      if (parts.length > 1) {
        const firstDir = parts[0];
        if (commonSrcDirs.includes(firstDir) || firstDir.endsWith("src")) {
          foundDirs.add(firstDir);
        }
      }
    });
    return Array.from(foundDirs);
  }
  /**
   * Find test directories
   */
  findTestDirectories(files) {
    const testDirs = /* @__PURE__ */ new Set();
    files.forEach((file) => {
      if (file.includes("test") || file.includes("spec") || file.includes("__tests__")) {
        const parts = file.split("/");
        const testDir = parts.find(
          (part) => part.includes("test") || part.includes("spec") || part === "__tests__"
        );
        if (testDir) testDirs.add(testDir);
      }
    });
    return Array.from(testDirs);
  }
  /**
   * Find configuration files
   */
  findConfigFiles(files) {
    const configPatterns = [
      /.*config\.(js|ts|json)$/,
      /^(babel|webpack|rollup|vite|next)\.config\./,
      /^(tsconfig|jsconfig)\.json$/,
      /^\.eslintrc/,
      /^\.prettierrc/,
      /^docker-compose\./,
      /^Dockerfile$/
    ];
    return files.filter((file) => {
      const filename = (0, import_path3.basename)(file);
      return configPatterns.some((pattern) => pattern.test(filename));
    });
  }
  /**
   * Detect build tools from files
   */
  detectBuildTools(files) {
    const tools = /* @__PURE__ */ new Set();
    if (files.some((f) => f.includes("package.json"))) {
      try {
        const packageJson = require((0, import_path3.join)(this.projectPath, "package.json"));
        if (packageJson.scripts) {
          if (packageJson.scripts.build) tools.add("npm/yarn");
          if (packageJson.devDependencies?.webpack) tools.add("webpack");
          if (packageJson.devDependencies?.vite) tools.add("vite");
          if (packageJson.devDependencies?.["@next/core"]) tools.add("next.js");
        }
      } catch (error) {
        this.logger.debug("Could not read package.json");
      }
    }
    if (files.some((f) => f.includes("Cargo.toml"))) tools.add("cargo");
    if (files.some((f) => f.includes("go.mod"))) tools.add("go modules");
    if (files.some((f) => f.includes("Makefile"))) tools.add("make");
    if (files.some((f) => f.includes("docker-compose"))) tools.add("docker");
    return Array.from(tools);
  }
  /**
   * Detect if project has API endpoints
   */
  detectAPI(files) {
    const apiPatterns = [
      /api\//,
      /routes\//,
      /controllers\//,
      /endpoints\//,
      /server\./,
      /app\.py$/,
      /main\.go$/
    ];
    return files.some((file) => apiPatterns.some((pattern) => pattern.test(file)));
  }
  /**
   * Detect if project has frontend components
   */
  detectFrontend(files) {
    return files.some(
      (file) => file.includes("index.html") || file.endsWith(".jsx") || file.endsWith(".tsx") || file.endsWith(".vue") || file.includes("components/") || file.includes("pages/")
    );
  }
  /**
   * Detect base URL for development server
   */
  async detectBaseURL() {
    try {
      const packageJsonPath = (0, import_path3.join)(this.projectPath, "package.json");
      if (await (0, import_fs_extra2.pathExists)(packageJsonPath)) {
        const packageJson = JSON.parse(await (0, import_fs_extra2.readFile)(packageJsonPath, "utf-8"));
        if (packageJson.scripts?.dev?.includes("3000")) return "http://localhost:3000";
        if (packageJson.scripts?.dev?.includes("8080")) return "http://localhost:8080";
        if (packageJson.scripts?.start?.includes("3000")) return "http://localhost:3000";
      }
    } catch (error) {
      this.logger.debug("Could not detect base URL");
    }
    return void 0;
  }
  /**
   * Detect technology stack
   */
  async detectTechnologies() {
    this.logger.debug("Detecting technology stack");
    const technologies = {
      language: await this.detectPrimaryLanguage(),
      framework: await this.detectFramework(),
      testing: await this.detectTestingFramework(),
      buildSystem: await this.detectBuildSystem(),
      cicd: await this.detectCICDPlatform(),
      database: await this.detectDatabase()
    };
    return technologies;
  }
  /**
   * Detect primary programming language
   */
  async detectPrimaryLanguage() {
    const files = await this.scanFilesystem();
    const extensions = {};
    files.forEach((file) => {
      const ext = (0, import_path3.extname)(file);
      extensions[ext] = (extensions[ext] || 0) + 1;
    });
    const langMap = {
      ".js": "javascript",
      ".ts": "typescript",
      ".jsx": "javascript",
      ".tsx": "typescript",
      ".py": "python",
      ".go": "go",
      ".rs": "rust",
      ".java": "java",
      ".php": "php",
      ".rb": "ruby"
    };
    const mostCommonExt = Object.entries(extensions).sort(([, a], [, b]) => b - a)[0]?.[0];
    return langMap[mostCommonExt] || "unknown";
  }
  /**
   * Detect web framework
   */
  async detectFramework() {
    try {
      const packageJsonPath = (0, import_path3.join)(this.projectPath, "package.json");
      if (await (0, import_fs_extra2.pathExists)(packageJsonPath)) {
        const packageJson = JSON.parse(await (0, import_fs_extra2.readFile)(packageJsonPath, "utf-8"));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps.react) return "react";
        if (deps.vue) return "vue";
        if (deps.angular || deps["@angular/core"]) return "angular";
        if (deps.express) return "express";
        if (deps.fastify) return "fastify";
        if (deps.next) return "next.js";
        if (deps.nuxt) return "nuxt.js";
      }
      const requirementsPath = (0, import_path3.join)(this.projectPath, "requirements.txt");
      if (await (0, import_fs_extra2.pathExists)(requirementsPath)) {
        const requirements = await (0, import_fs_extra2.readFile)(requirementsPath, "utf-8");
        if (requirements.includes("django")) return "django";
        if (requirements.includes("flask")) return "flask";
        if (requirements.includes("fastapi")) return "fastapi";
      }
    } catch (error) {
      this.logger.debug("Could not detect framework");
    }
    return void 0;
  }
  /**
   * Detect testing framework
   */
  async detectTestingFramework() {
    try {
      const packageJsonPath = (0, import_path3.join)(this.projectPath, "package.json");
      if (await (0, import_fs_extra2.pathExists)(packageJsonPath)) {
        const packageJson = JSON.parse(await (0, import_fs_extra2.readFile)(packageJsonPath, "utf-8"));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps.jest) return "jest";
        if (deps.vitest) return "vitest";
        if (deps.mocha) return "mocha";
        if (deps.cypress) return "cypress";
        if (deps.playwright || deps["@playwright/test"]) return "playwright";
        if (deps["@testing-library/react"]) return "react-testing-library";
      }
    } catch (error) {
      this.logger.debug("Could not detect testing framework");
    }
    return void 0;
  }
  /**
   * Detect build system
   */
  async detectBuildSystem() {
    const files = await this.scanFilesystem();
    if (files.some((f) => f.includes("vite.config"))) return "vite";
    if (files.some((f) => f.includes("webpack.config"))) return "webpack";
    if (files.some((f) => f.includes("rollup.config"))) return "rollup";
    if (files.some((f) => f.includes("next.config"))) return "next.js";
    if (files.some((f) => f.includes("Cargo.toml"))) return "cargo";
    if (files.some((f) => f.includes("go.mod"))) return "go build";
    return void 0;
  }
  /**
   * Detect CI/CD platform
   */
  async detectCICDPlatform() {
    const files = await this.scanFilesystem();
    if (files.some((f) => f.includes(".github/workflows"))) return "github-actions";
    if (files.some((f) => f.includes(".gitlab-ci.yml"))) return "gitlab-ci";
    if (files.some((f) => f.includes("azure-pipelines.yml"))) return "azure-pipelines";
    if (files.some((f) => f.includes("Jenkinsfile"))) return "jenkins";
    return void 0;
  }
  /**
   * Detect database technology
   */
  async detectDatabase() {
    try {
      const packageJsonPath = (0, import_path3.join)(this.projectPath, "package.json");
      if (await (0, import_fs_extra2.pathExists)(packageJsonPath)) {
        const packageJson = JSON.parse(await (0, import_fs_extra2.readFile)(packageJsonPath, "utf-8"));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        if (deps.mongodb || deps.mongoose) return "mongodb";
        if (deps.pg || deps.postgres) return "postgresql";
        if (deps.mysql || deps.mysql2) return "mysql";
        if (deps.sqlite3 || deps["better-sqlite3"]) return "sqlite";
        if (deps.redis) return "redis";
      }
    } catch (error) {
      this.logger.debug("Could not detect database");
    }
    return void 0;
  }
  /**
   * Extract common code patterns
   */
  async extractCodePatterns() {
    this.logger.debug("Extracting code patterns");
    const patterns = {
      common: await this.detectCommonPatterns(),
      architectural: await this.detectArchitecturalPatterns(),
      naming: await this.detectNamingPatterns(),
      imports: await this.detectImportPatterns()
    };
    return patterns;
  }
  async detectCommonPatterns() {
    const patterns = [];
    try {
      const files = await this.scanFilesystem();
      const codeFiles = files.filter((f) => /\.(js|ts|jsx|tsx)$/.test(f));
      for (const file of codeFiles.slice(0, 10)) {
        try {
          const content = await (0, import_fs_extra2.readFile)((0, import_path3.join)(this.projectPath, file), "utf-8");
          if (content.includes("export {") && content.includes("} from")) {
            patterns.push("barrel-exports");
          }
          if (content.includes("try {") && content.includes("catch")) {
            patterns.push("error-handling");
          }
          if (content.includes("async ") && content.includes("await ")) {
            patterns.push("async-await");
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      this.logger.debug("Could not analyze code patterns");
    }
    return [...new Set(patterns)];
  }
  async detectArchitecturalPatterns() {
    const patterns = [];
    const files = await this.scanFilesystem();
    if (files.some((f) => f.includes("components/"))) patterns.push("component-based");
    if (files.some((f) => f.includes("services/"))) patterns.push("service-layer");
    if (files.some((f) => f.includes("utils/") || f.includes("helpers/"))) patterns.push("utility-functions");
    if (files.some((f) => f.includes("types/") || f.includes("interfaces/"))) patterns.push("type-definitions");
    return patterns;
  }
  async detectNamingPatterns() {
    const patterns = [];
    const files = await this.scanFilesystem();
    const hasKebabCase = files.some((f) => /[a-z]+-[a-z]+/.test((0, import_path3.basename)(f)));
    const hasCamelCase = files.some((f) => /[a-z][A-Z]/.test((0, import_path3.basename)(f)));
    const hasPascalCase = files.some((f) => /^[A-Z][a-z]/.test((0, import_path3.basename)(f)));
    if (hasKebabCase) patterns.push("kebab-case");
    if (hasCamelCase) patterns.push("camelCase");
    if (hasPascalCase) patterns.push("PascalCase");
    return patterns;
  }
  async detectImportPatterns() {
    return ["relative-imports", "absolute-imports"];
  }
  /**
   * Run quality analysis using available tools
   */
  async runQualityAnalysis() {
    this.logger.debug("Running quality analysis");
    let metrics = {
      hasQualityGates: false,
      linting: false,
      formatting: false
    };
    if (this.mcpService.isAvailable("sonarcloud")) {
      try {
        const sonarResults = await this.mcpService.callMCP("sonarcloud", "get_project_analysis", {
          projectKey: await this.detectProjectKey()
        });
        metrics = {
          ...metrics,
          coverage: sonarResults.coverage,
          complexity: sonarResults.complexity,
          hasQualityGates: true
        };
      } catch (error) {
        this.logger.debug("SonarCloud analysis failed, using basic analysis");
      }
    }
    const basicAnalysis = await this.basicQualityAnalysis();
    return { ...basicAnalysis, ...metrics };
  }
  async basicQualityAnalysis() {
    const files = await this.scanFilesystem();
    return {
      hasQualityGates: files.some((f) => f.includes(".eslintrc") || f.includes("sonar")),
      linting: files.some((f) => f.includes(".eslintrc")),
      formatting: files.some((f) => f.includes(".prettierrc"))
    };
  }
  async detectProjectKey() {
    return (0, import_path3.basename)(this.projectPath);
  }
  /**
   * Analyze dependencies
   */
  async analyzeDependencies() {
    this.logger.debug("Analyzing dependencies");
    try {
      const packageJsonPath = (0, import_path3.join)(this.projectPath, "package.json");
      if (await (0, import_fs_extra2.pathExists)(packageJsonPath)) {
        const packageJson = JSON.parse(await (0, import_fs_extra2.readFile)(packageJsonPath, "utf-8"));
        const dependencies = [
          ...Object.entries(packageJson.dependencies || {}).map(([name, version]) => ({
            name,
            version,
            type: "dependency"
          })),
          ...Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ({
            name,
            version,
            type: "devDependency"
          })),
          ...Object.entries(packageJson.peerDependencies || {}).map(([name, version]) => ({
            name,
            version,
            type: "peerDependency"
          }))
        ];
        return {
          packageManager: await this.detectPackageManager(),
          dependencies,
          outdated: []
          // Would need npm outdated or similar
        };
      }
    } catch (error) {
      this.logger.debug("Could not analyze dependencies");
    }
    return {
      packageManager: "unknown",
      dependencies: [],
      outdated: []
    };
  }
  async detectPackageManager() {
    const files = await this.scanFilesystem();
    if (files.some((f) => f.includes("yarn.lock"))) return "yarn";
    if (files.some((f) => f.includes("pnpm-lock.yaml"))) return "pnpm";
    if (files.some((f) => f.includes("package-lock.json"))) return "npm";
    return "npm";
  }
  /**
   * Analyze existing test setup
   */
  async analyzeExistingTests() {
    this.logger.debug("Analyzing existing test setup");
    const files = await this.scanFilesystem();
    const testFiles = files.filter(
      (f) => f.includes("test") || f.includes("spec") || f.includes("__tests__")
    );
    const hasTests = testFiles.length > 0;
    const framework = await this.detectTestingFramework();
    const testDirectories = this.findTestDirectories(files);
    return {
      hasTests,
      framework,
      testDirectories,
      coverage: await this.analyzeCoverageSetup(),
      e2e: await this.analyzeE2ESetup()
    };
  }
  async analyzeCoverageSetup() {
    try {
      const packageJsonPath = (0, import_path3.join)(this.projectPath, "package.json");
      if (await (0, import_fs_extra2.pathExists)(packageJsonPath)) {
        const packageJson = JSON.parse(await (0, import_fs_extra2.readFile)(packageJsonPath, "utf-8"));
        if (packageJson.jest?.collectCoverage) {
          return {
            configured: true,
            threshold: packageJson.jest.coverageThreshold?.global?.lines,
            tool: "jest"
          };
        }
      }
    } catch (error) {
      this.logger.debug("Could not analyze coverage setup");
    }
    return { configured: false };
  }
  async analyzeE2ESetup() {
    const framework = await this.detectTestingFramework();
    const hasE2E = ["cypress", "playwright"].includes(framework || "");
    return {
      configured: hasE2E,
      framework: hasE2E ? framework : void 0
    };
  }
  /**
   * Save analysis results
   */
  async saveAnalysis(analysis) {
    const projectTazzDir = getProjectTazzDir(this.projectPath);
    const analysisPath = (0, import_path3.join)(projectTazzDir, "analysis.json");
    await (0, import_fs_extra2.ensureFile)(analysisPath);
    await (0, import_fs_extra2.writeFile)(analysisPath, JSON.stringify(analysis, null, 2));
    this.logger.debug("Analysis saved", { path: analysisPath });
  }
};

// src/core/services/RulesGenerator.ts
var import_fs_extra3 = require("fs-extra");
var import_path4 = require("path");
var RulesGenerationError = class extends TazzError {
  code = "RULES_GENERATION_ERROR";
  severity = "medium";
};
var IntelligentRulesGenerator = class {
  logger;
  projectPath;
  constructor(logger3, projectPath = process.cwd()) {
    this.logger = logger3;
    this.projectPath = projectPath;
  }
  /**
   * Generate complete set of project rules based on analysis
   */
  async generateProjectRules(analysis) {
    this.logger.info("Generating intelligent project rules", {
      projectType: analysis.structure.type,
      language: analysis.technologies.language
    });
    try {
      const rules = {
        codeStyle: await this.generateCodeStyleRules(analysis),
        testing: await this.generateTestingRules(analysis),
        gitWorkflow: await this.generateGitRules(analysis),
        qualityGates: await this.generateQualityGates(analysis),
        agentBehavior: await this.generateAgentRules(analysis)
      };
      await this.writeRulesToFiles(rules);
      this.logger.info("Project rules generated successfully");
      return rules;
    } catch (error) {
      this.logger.error("Failed to generate project rules", error);
      throw new RulesGenerationError("Rules generation failed", {
        projectPath: this.projectPath
      }, error);
    }
  }
  /**
   * Generate code style rules based on detected patterns
   */
  async generateCodeStyleRules(analysis) {
    const language = analysis.technologies.language;
    const framework = analysis.technologies.framework;
    const patterns = analysis.patterns;
    const rules = /* @__PURE__ */ new Map();
    const examples = /* @__PURE__ */ new Map();
    switch (language) {
      case "typescript":
        rules.set("types", "Use explicit types for function parameters and return values");
        rules.set("imports", "Prefer absolute imports from src/ directory");
        rules.set("interfaces", "Use interfaces for object shapes, types for unions/primitives");
        examples.set("function", "function processData(input: string): ProcessedData { ... }");
        examples.set("import", "import { utils } from '@/utils'");
        break;
      case "javascript":
        rules.set("functions", "Use const for function declarations when possible");
        rules.set("destructuring", "Use destructuring for object properties");
        examples.set("function", "const processData = (input) => { ... }");
        break;
      case "python":
        rules.set("naming", "Use snake_case for variables and functions");
        rules.set("docstrings", "Include docstrings for all public functions");
        examples.set("function", "def process_data(input_str: str) -> ProcessedData:");
        break;
    }
    if (framework === "react") {
      rules.set("components", "Use functional components with hooks");
      rules.set("props", "Destructure props in component signature");
      examples.set("component", "const MyComponent: React.FC<Props> = ({ title, children }) => ...");
    }
    if (patterns.common.includes("async-await")) {
      rules.set("async", "Use async/await instead of .then() chains");
      examples.set("async", "const data = await fetchData() instead of fetchData().then()");
    }
    if (patterns.common.includes("error-handling")) {
      rules.set("errors", "Wrap async operations in try-catch with proper error types");
      examples.set("error", "try { await riskyOperation() } catch (error: OperationError) { ... }");
    }
    return {
      language,
      formatter: this.detectFormatter(analysis),
      linter: this.detectLinter(analysis),
      rules: Object.fromEntries(rules),
      examples: Object.fromEntries(examples),
      patterns: patterns.common
    };
  }
  detectFormatter(analysis) {
    if (analysis.quality.formatting) {
      if (analysis.technologies.language === "python") return "black";
      return "prettier";
    }
    return void 0;
  }
  detectLinter(analysis) {
    if (analysis.quality.linting) {
      switch (analysis.technologies.language) {
        case "typescript":
        case "javascript":
          return "eslint";
        case "python":
          return "pylint";
        default:
          return "generic";
      }
    }
    return void 0;
  }
  /**
   * Generate testing rules based on existing setup
   */
  async generateTestingRules(analysis) {
    const testingStrategy = analysis.testingStrategy;
    const framework = testingStrategy.framework || this.inferTestingFramework(analysis);
    return {
      framework,
      testLocation: testingStrategy.testDirectories[0] || "tests/",
      namingConvention: this.detectTestNaming(analysis),
      coverage: {
        minimum: testingStrategy.coverage?.threshold || 80,
        enforce: testingStrategy.coverage?.configured || false
      },
      patterns: {
        unit: await this.generateUnitTestPatterns(analysis),
        integration: await this.generateIntegrationTestPatterns(analysis),
        e2e: await this.generateE2ETestPatterns(analysis)
      },
      templates: await this.generateTestTemplates(analysis)
    };
  }
  inferTestingFramework(analysis) {
    const language = analysis.technologies.language;
    switch (language) {
      case "typescript":
      case "javascript":
        return "vitest";
      // Modern default
      case "python":
        return "pytest";
      case "go":
        return "go test";
      case "rust":
        return "cargo test";
      default:
        return "generic";
    }
  }
  detectTestNaming(analysis) {
    const hasSpecFiles = analysis.testingStrategy.testDirectories.some(
      (dir) => dir.includes("spec")
    );
    return hasSpecFiles ? "*.spec.*" : "*.test.*";
  }
  async generateUnitTestPatterns(analysis) {
    const patterns = [
      "Test individual functions in isolation",
      "Mock external dependencies",
      "Use descriptive test names that explain the scenario"
    ];
    if (analysis.technologies.framework === "react") {
      patterns.push("Test component behavior, not implementation details");
      patterns.push("Use React Testing Library for component tests");
    }
    return patterns;
  }
  async generateIntegrationTestPatterns(analysis) {
    const patterns = [
      "Test interactions between modules",
      "Use real dependencies where possible"
    ];
    if (analysis.structure.hasAPI) {
      patterns.push("Test API endpoints with real database");
      patterns.push("Validate request/response schemas");
    }
    return patterns;
  }
  async generateE2ETestPatterns(analysis) {
    const patterns = [];
    if (analysis.structure.hasFrontend) {
      patterns.push("Test complete user workflows");
      patterns.push("Use page object pattern for maintainability");
      patterns.push("Test critical user paths first");
    }
    return patterns;
  }
  async generateTestTemplates(analysis) {
    const templates = {};
    templates.unit = await this.createUnitTestTemplate(analysis);
    if (analysis.structure.hasAPI) {
      templates.integration = await this.createIntegrationTestTemplate(analysis);
    }
    if (analysis.structure.hasFrontend) {
      templates.e2e = await this.createE2ETestTemplate(analysis);
    }
    return templates;
  }
  async createUnitTestTemplate(analysis) {
    const language = analysis.technologies.language;
    const framework = analysis.testingStrategy.framework || this.inferTestingFramework(analysis);
    switch (language) {
      case "typescript":
      case "javascript":
        return this.createJSUnitTestTemplate(framework, analysis);
      case "python":
        return this.createPythonUnitTestTemplate();
      default:
        return this.createGenericUnitTestTemplate();
    }
  }
  createJSUnitTestTemplate(framework, analysis) {
    const isReact = analysis.technologies.framework === "react";
    let template = `import { describe, it, expect, beforeEach } from '${framework}'`;
    if (isReact) {
      template += `
import { render, screen } from '@testing-library/react'`;
    }
    template += `
import { {{COMPONENT_NAME}} } from '../src/{{COMPONENT_PATH}}'

describe('{{COMPONENT_NAME}}', () => {
  beforeEach(() => {
    // Setup test data and mocks
  })

  it('should {{TEST_DESCRIPTION}}', async () => {
    // Arrange
    const input = {{TEST_INPUT}}

    // Act  
    const result = {{COMPONENT_NAME}}(input)

    // Assert
    expect(result).{{ASSERTION}}
  })

  it('should handle error cases', () => {
    // Test error scenarios
  })
})`;
    return template;
  }
  createPythonUnitTestTemplate() {
    return `import pytest
from unittest.mock import Mock, patch
from src.{{MODULE_NAME}} import {{FUNCTION_NAME}}

class Test{{FUNCTION_NAME}}:
    def setup_method(self):
        """Setup test data before each test."""
        pass

    def test_{{FUNCTION_NAME}}_success(self):
        """Test {{FUNCTION_NAME}} with valid input."""
        # Arrange
        input_data = {{TEST_INPUT}}
        
        # Act
        result = {{FUNCTION_NAME}}(input_data)
        
        # Assert
        assert result == {{EXPECTED_OUTPUT}}

    def test_{{FUNCTION_NAME}}_error(self):
        """Test {{FUNCTION_NAME}} error handling."""
        with pytest.raises({{EXCEPTION_TYPE}}):
            {{FUNCTION_NAME}}(invalid_input)
`;
  }
  createGenericUnitTestTemplate() {
    return `// Unit test template for {{COMPONENT_NAME}}
// Generated by Tazz CLI

describe('{{COMPONENT_NAME}}', () => {
  // Add your test cases here
})`;
  }
  async createIntegrationTestTemplate(analysis) {
    return `// Integration test template for API endpoints
import request from 'supertest'
import app from '../src/app'

describe('{{API_ENDPOINT}}', () => {
  beforeEach(async () => {
    // Setup test database
  })

  afterEach(async () => {
    // Cleanup test data
  })

  it('should {{ENDPOINT_BEHAVIOR}}', async () => {
    const response = await request(app)
      .{{HTTP_METHOD}}('{{ENDPOINT_PATH}}')
      .send({{REQUEST_BODY}})
      .expect({{EXPECTED_STATUS}})

    expect(response.body).toMatchObject({{EXPECTED_RESPONSE}})
  })
})`;
  }
  async createE2ETestTemplate(analysis) {
    const hasPlaywright = analysis.testingStrategy.e2e?.framework === "playwright";
    if (hasPlaywright) {
      return `import { test, expect } from '@playwright/test'

test.describe('{{FEATURE_NAME}}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${analysis.structure.baseURL || "http://localhost:3000"}')
  })

  test('should {{TEST_DESCRIPTION}}', async ({ page }) => {
    // Navigate and interact with page
    await page.click('{{SELECTOR}}')
    await page.fill('input[name="{{INPUT_NAME}}"]', '{{TEST_VALUE}}')
    
    // Assert expected results
    await expect(page.locator('{{RESULT_SELECTOR}}')).toHaveText('{{EXPECTED_TEXT}}')
  })
})`;
    }
    return `// E2E test template
describe('{{FEATURE_NAME}}', () => {
  it('should complete user workflow', () => {
    // Add E2E test steps
  })
})`;
  }
  /**
   * Generate Git workflow rules
   */
  async generateGitRules(analysis) {
    return {
      branchNaming: this.detectBranchNamingConvention(analysis),
      commitMessage: {
        format: "type(scope): description",
        examples: [
          "feat(auth): add OAuth integration",
          "fix(api): resolve timeout issues",
          "docs(readme): update installation guide"
        ]
      },
      pullRequest: {
        template: await this.generatePRTemplate(analysis),
        requirements: [
          "All tests must pass",
          "Code coverage must not decrease",
          "PR description must be filled",
          "At least one approval required"
        ]
      }
    };
  }
  detectBranchNamingConvention(analysis) {
    return "feature/JIRA-123-description";
  }
  async generatePRTemplate(analysis) {
    return `## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally`;
  }
  /**
   * Generate quality gate rules
   */
  async generateQualityGates(analysis) {
    return {
      coverage: {
        minimum: analysis.quality.coverageThreshold || 80,
        failOnDecrease: analysis.quality.hasQualityGates
      },
      linting: {
        required: analysis.quality.linting,
        autoFix: true
      },
      testing: {
        required: analysis.testingStrategy.hasTests,
        types: this.getRequiredTestTypes(analysis)
      },
      security: {
        scanRequired: analysis.quality.hasQualityGates,
        tools: this.getSecurityTools(analysis)
      }
    };
  }
  getRequiredTestTypes(analysis) {
    const types = ["unit"];
    if (analysis.structure.hasAPI) types.push("integration");
    if (analysis.structure.hasFrontend) types.push("e2e");
    return types;
  }
  getSecurityTools(analysis) {
    const tools = [];
    if (analysis.technologies.language === "javascript" || analysis.technologies.language === "typescript") {
      tools.push("npm audit");
    }
    if (analysis.quality.hasQualityGates) {
      tools.push("sonarcloud");
    }
    return tools;
  }
  /**
   * Generate agent behavior rules
   */
  async generateAgentRules(analysis) {
    return {
      codeGeneration: {
        followPatterns: true,
        useExistingStyles: true,
        includeTests: analysis.testingStrategy.hasTests
      },
      fileModification: {
        backupFirst: true,
        formatAfter: analysis.quality.formatting,
        runLinter: analysis.quality.linting
      },
      documentation: {
        updateReadme: true,
        includeComments: analysis.technologies.language === "python",
        // Python emphasizes docstrings
        generateChangelog: analysis.quality.hasQualityGates
      }
    };
  }
  /**
   * Write all rules to separate files
   */
  async writeRulesToFiles(rules) {
    const projectTazzDir = getProjectTazzDir(this.projectPath);
    const rulesDir = (0, import_path4.join)(projectTazzDir, "rules");
    await (0, import_fs_extra3.ensureDir)(rulesDir);
    await Promise.all([
      this.writeRuleFile((0, import_path4.join)(rulesDir, "code-style.json"), rules.codeStyle),
      this.writeRuleFile((0, import_path4.join)(rulesDir, "testing.json"), rules.testing),
      this.writeRuleFile((0, import_path4.join)(rulesDir, "git-workflow.json"), rules.gitWorkflow),
      this.writeRuleFile((0, import_path4.join)(rulesDir, "quality-gates.json"), rules.qualityGates),
      this.writeRuleFile((0, import_path4.join)(rulesDir, "agent-behavior.json"), rules.agentBehavior)
    ]);
    await this.writeRuleFile((0, import_path4.join)(rulesDir, "all-rules.json"), rules);
    this.logger.info("Rules files written", { rulesDir });
  }
  async writeRuleFile(path, content) {
    await (0, import_fs_extra3.ensureFile)(path);
    await (0, import_fs_extra3.writeFile)(path, JSON.stringify(content, null, 2));
  }
  /**
   * Generate hook scripts for Claude Code integration
   */
  async generateHookScripts(analysis) {
    this.logger.info("Generating Claude Code hook scripts");
    const projectTazzDir = getProjectTazzDir(this.projectPath);
    const hooksDir = (0, import_path4.join)(projectTazzDir, "hooks");
    await (0, import_fs_extra3.ensureDir)(hooksDir);
    await Promise.all([
      this.generateSessionStartHook(hooksDir, analysis),
      this.generatePreToolHook(hooksDir, analysis),
      this.generatePostToolHook(hooksDir, analysis),
      this.generateQualityGateHook(hooksDir, analysis),
      this.generateJiraIntegrationHook(hooksDir, analysis)
    ]);
    this.logger.info("Hook scripts generated", { hooksDir });
  }
  async generateSessionStartHook(hooksDir, analysis) {
    const script = `#!/bin/bash
# Auto-generated session start hook for ${analysis.structure.type} project

SESSION_ID="$1"
TASK_DESCRIPTION="$2"

echo "\u{1F300} Starting Tazz session: $SESSION_ID"

# Set session environment
export TAZZ_SESSION_ID="$SESSION_ID"
export TAZZ_ACTIVE="true"
export TAZZ_PROJECT_TYPE="${analysis.structure.type}"
export TAZZ_LANGUAGE="${analysis.technologies.language}"

# Initialize session context
tazz context set --session "$SESSION_ID" --task "$TASK_DESCRIPTION"

# Load project rules
tazz rules load --session "$SESSION_ID"

# Setup development environment
${this.getEnvSetupCommands(analysis)}

echo "\u2705 Session $SESSION_ID ready"
`;
    await this.writeExecutableScript((0, import_path4.join)(hooksDir, "session-start.sh"), script);
  }
  async generatePreToolHook(hooksDir, analysis) {
    const script = `#!/bin/bash
# Pre-tool execution hook

TOOL_NAME="$1"
TOOL_PARAMS="$2"

if [[ "$TAZZ_ACTIVE" == "true" ]]; then
    CURRENT_SESSION=$(tazz current-session)
    
    if [[ -n "$CURRENT_SESSION" ]]; then
        # Log tool usage
        tazz log tool-use --session "$CURRENT_SESSION" --tool "$TOOL_NAME"
        
        # Validate against project rules
        tazz validate --session "$CURRENT_SESSION" --tool "$TOOL_NAME" --params "$TOOL_PARAMS"
        
        # Pre-execution setup
        case "$TOOL_NAME" in
            "Edit"|"Write")
                tazz backup --session "$CURRENT_SESSION"
                ;;
            "Bash")
                tazz safety-check --session "$CURRENT_SESSION" --command "$TOOL_PARAMS"
                ;;
        esac
    fi
fi
`;
    await this.writeExecutableScript((0, import_path4.join)(hooksDir, "pre-tool.sh"), script);
  }
  async generatePostToolHook(hooksDir, analysis) {
    const formatCommand = analysis.quality.formatting ? this.getFormatCommand(analysis) : 'echo "No formatting configured"';
    const lintCommand = analysis.quality.linting ? this.getLintCommand(analysis) : 'echo "No linting configured"';
    const script = `#!/bin/bash
# Post-tool execution hook

TOOL_NAME="$1"
TOOL_RESULT="$2"

if [[ "$TAZZ_ACTIVE" == "true" ]]; then
    CURRENT_SESSION=$(tazz current-session)
    
    if [[ -n "$CURRENT_SESSION" ]]; then
        case "$TOOL_NAME" in
            "Edit"|"Write")
                # Format code
                ${formatCommand}
                
                # Run linting
                ${lintCommand}
                ;;
            "Bash")
                tazz log command-result --session "$CURRENT_SESSION" --result "$TOOL_RESULT"
                ;;
        esac
        
        # Update task progress
        tazz task update --session "$CURRENT_SESSION"
        
        # Auto-commit if configured
        if tazz config get auto-commit --session "$CURRENT_SESSION"; then
            tazz commit --session "$CURRENT_SESSION" --auto
        fi
    fi
fi
`;
    await this.writeExecutableScript((0, import_path4.join)(hooksDir, "post-tool.sh"), script);
  }
  async generateQualityGateHook(hooksDir, analysis) {
    const testCommand = this.getTestCommand(analysis);
    const coverageCommand = this.getCoverageCommand(analysis);
    const script = `#!/bin/bash
# Quality gate hook

SESSION_ID="$1"

echo "\u{1F50D} Running quality gates for session $SESSION_ID"

# Run tests
if ! ${testCommand}; then
    tazz task mark-blocked --session "$SESSION_ID" --reason "Tests failing"
    exit 1
fi

# Check coverage
COVERAGE=$(${coverageCommand})
MIN_COVERAGE=${analysis.quality.coverageThreshold || 80}

if (( $(echo "$COVERAGE < $MIN_COVERAGE" | bc -l) )); then
    tazz task mark-blocked --session "$SESSION_ID" --reason "Coverage below $MIN_COVERAGE%"
    exit 1
fi

echo "\u2705 Quality gates passed for session $SESSION_ID"
`;
    await this.writeExecutableScript((0, import_path4.join)(hooksDir, "quality-gate.sh"), script);
  }
  async generateJiraIntegrationHook(hooksDir, analysis) {
    const script = `#!/bin/bash
# Jira integration hook

SESSION_ID="$1"
TASK_TYPE="$2"

if [[ "$SESSION_ID" =~ ^[A-Z]+-[0-9]+$ ]]; then
    echo "\u{1F3AB} Fetching Jira ticket: $SESSION_ID"
    
    # Use Atlassian MCP to fetch ticket details
    TICKET_INFO=$(tazz mcp call atlassian jira_get_issue --issue-key "$SESSION_ID")
    
    # Extract task information
    TITLE=$(echo "$TICKET_INFO" | jq -r '.fields.summary')
    DESCRIPTION=$(echo "$TICKET_INFO" | jq -r '.fields.description')
    PRIORITY=$(echo "$TICKET_INFO" | jq -r '.fields.priority.name')
    
    # Update session context
    tazz context set --session "$SESSION_ID" \\
        --title "$TITLE" \\
        --description "$DESCRIPTION" \\
        --priority "$PRIORITY"
        
    # Set branch naming convention  
    BRANCH_NAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g')
    tazz git set-branch --session "$SESSION_ID" --name "feature/$SESSION_ID-$BRANCH_NAME"
    
    echo "\u2705 Jira integration complete for $SESSION_ID"
fi
`;
    await this.writeExecutableScript((0, import_path4.join)(hooksDir, "jira-integration.sh"), script);
  }
  getEnvSetupCommands(analysis) {
    const commands = [];
    if (analysis.technologies.language === "javascript" || analysis.technologies.language === "typescript") {
      commands.push("# Ensure dependencies are installed");
      commands.push('if [[ ! -d "node_modules" ]]; then npm install; fi');
    }
    if (analysis.technologies.language === "python") {
      commands.push("# Activate virtual environment if exists");
      commands.push('if [[ -d "venv" ]]; then source venv/bin/activate; fi');
    }
    return commands.join("\n");
  }
  getFormatCommand(analysis) {
    if (analysis.technologies.language === "python") {
      return 'black . || echo "Formatting skipped"';
    }
    return 'npx prettier --write . || echo "Formatting skipped"';
  }
  getLintCommand(analysis) {
    switch (analysis.technologies.language) {
      case "typescript":
      case "javascript":
        return 'npx eslint --fix . || echo "Linting skipped"';
      case "python":
        return 'pylint . || echo "Linting skipped"';
      default:
        return 'echo "No linting configured"';
    }
  }
  getTestCommand(analysis) {
    const framework = analysis.testingStrategy.framework;
    switch (framework) {
      case "jest":
        return "npm test";
      case "vitest":
        return "npx vitest run";
      case "pytest":
        return "python -m pytest";
      case "go test":
        return "go test ./...";
      case "cargo test":
        return "cargo test";
      default:
        return 'echo "No test command configured"';
    }
  }
  getCoverageCommand(analysis) {
    const framework = analysis.testingStrategy.framework;
    switch (framework) {
      case "jest":
        return `npm test -- --coverage --silent | grep "All files" | awk '{print $10}' | sed 's/%//'`;
      case "vitest":
        return `npx vitest run --coverage --silent | grep "All files" | awk '{print $4}' | sed 's/%//'`;
      case "pytest":
        return "python -m pytest --cov=. --cov-report=term-missing | grep TOTAL | awk '{print $4}' | sed 's/%//'";
      default:
        return 'echo "0"';
    }
  }
  async writeExecutableScript(path, content) {
    await (0, import_fs_extra3.ensureFile)(path);
    await (0, import_fs_extra3.writeFile)(path, content);
    const fs = await import("fs");
    await fs.promises.chmod(path, 493);
  }
};

// src/cli/commands/make.ts
var MakeCommand = class {
  logger = getLogger();
  build() {
    return new import_commander.Command("make").description("\u{1F3D7}\uFE0F  Make/setup Tazz with intelligent codebase analysis and MCP integration").action(async () => {
      await this.execute();
    });
  }
  async execute() {
    console.log("");
    console.log(import_chalk.default.bold.cyan("\u{1F300} Starting Tazz Initialization"));
    console.log(import_chalk.default.gray("Setting up intelligent development environment..."));
    console.log("");
    try {
      if (await this.checkExistingInstallation()) {
        console.log(import_chalk.default.yellow("\u26A0\uFE0F  Tazz is already initialized in this project"));
        return;
      }
      const projectPath = process.cwd();
      await this.setupInfrastructure(projectPath);
      const mcpService = await this.setupMCPIntegration(projectPath);
      const analysis = await this.analyzeCodebase(projectPath, mcpService);
      if (analysis) {
        await this.generateIntelligentRules(projectPath, analysis);
        await this.generateHookScripts(projectPath, analysis);
      }
      if (analysis) {
        await this.setupTestingStrategy(projectPath, analysis);
      }
      await this.createConfiguration(projectPath, {
        mcpService,
        analysis
      });
      await this.updateGitignore(projectPath);
      console.log("");
      console.log(import_chalk.default.green("\u2705 Tazz initialization completed successfully!"));
      console.log("");
      console.log(import_chalk.default.bold("Next steps:"));
      console.log(import_chalk.default.gray("  \u2022 Run"), import_chalk.default.cyan("tazz start <ticket-id>"), import_chalk.default.gray("to create a new session"));
      console.log(import_chalk.default.gray("  \u2022 Run"), import_chalk.default.cyan("tazz -d"), import_chalk.default.gray("to open detached console mode"));
      console.log(import_chalk.default.gray("  \u2022 Run"), import_chalk.default.cyan("tazz list"), import_chalk.default.gray("to see all sessions"));
      console.log("");
    } catch (error) {
      this.logger.error("Initialization failed", error);
      console.log("");
      console.log(import_chalk.default.red("\u274C Tazz initialization failed"));
      if (error instanceof TazzError) {
        console.log(import_chalk.default.red(`   ${error.message}`));
      } else {
        console.log(import_chalk.default.red("   An unexpected error occurred"));
        console.log(import_chalk.default.gray("   Check logs for details: ~/.tazz/logs/tazz.log"));
      }
      process.exit(1);
    }
  }
  async checkExistingInstallation() {
    const projectPath = process.cwd();
    const hasTazz = await (0, import_fs_extra4.pathExists)((0, import_path5.join)(projectPath, ".tazz"));
    const hasClaude = await (0, import_fs_extra4.pathExists)((0, import_path5.join)(projectPath, ".claude"));
    return hasTazz || hasClaude;
  }
  async setupInfrastructure(projectPath) {
    const spinner = (0, import_ora.default)("Setting up Tazz infrastructure").start();
    try {
      const globalTazzDir = getTazzDir();
      const projectTazzDir = getProjectTazzDir(projectPath);
      const directories = [
        // Global directories
        (0, import_path5.join)(globalTazzDir, "logs"),
        (0, import_path5.join)(globalTazzDir, "sessions"),
        (0, import_path5.join)(globalTazzDir, "config"),
        (0, import_path5.join)(globalTazzDir, "projects"),
        // Project-specific directories in centralized location
        projectTazzDir,
        (0, import_path5.join)(projectTazzDir, "rules"),
        (0, import_path5.join)(projectTazzDir, "hooks"),
        (0, import_path5.join)(projectTazzDir, "analysis"),
        (0, import_path5.join)(projectTazzDir, "templates"),
        // Minimal local directories for user collaboration
        (0, import_path5.join)(projectPath, ".tazz"),
        (0, import_path5.join)(projectPath, ".claude")
      ];
      await Promise.all(
        directories.map((dir) => (0, import_fs_extra4.ensureDir)(dir))
      );
      const projectName = (() => {
        try {
          return require((0, import_path5.join)(projectPath, "package.json")).name || "unknown";
        } catch {
          return "unknown";
        }
      })();
      const initialFiles = {
        // Centralized files
        [(0, import_path5.join)(projectTazzDir, "sessions.json")]: JSON.stringify({ sessions: [] }, null, 2),
        [(0, import_path5.join)(projectTazzDir, "config.json")]: JSON.stringify({
          version: "1.0.0",
          initialized: (/* @__PURE__ */ new Date()).toISOString(),
          project: {
            name: projectName,
            path: projectPath,
            type: "library"
          },
          features: {
            mcpIntegration: false,
            codebaseAnalysis: true,
            intelligentRules: true,
            hooksIntegration: true
          },
          settings: {
            maxConcurrentSessions: 10,
            defaultBranch: "main",
            tmuxPrefix: "tazz_",
            agentTimeout: 3e5,
            logLevel: "info",
            autoCommit: false,
            qualityGates: {
              enabled: false,
              coverage: 80
            }
          },
          connectedServices: {
            mcp: [],
            git: true,
            tmux: true
          }
        }, null, 2),
        // Local file for user collaboration
        [(0, import_path5.join)(projectPath, ".tazz", "tazz-todo.md")]: this.createInitialTodoTemplate()
      };
      await Promise.all(
        Object.entries(initialFiles).map(
          ([file, content]) => (0, import_fs_extra4.writeFile)(file, content)
        )
      );
      await this.copyClaudeTemplate(projectPath);
      spinner.succeed("Infrastructure setup complete");
    } catch (error) {
      spinner.fail("Infrastructure setup failed");
      throw error;
    }
  }
  createInitialTodoTemplate() {
    return `# Tazz Task Template

## Session Tasks
- [ ] Task 1: Complete implementation
      Session name: task-1
      Description: 
        Implement the main functionality for this feature. This context will be passed to the Claude instance in the tmux session.

- [ ] Task 2: Write tests
      Session name: task-2
      Description: 
        Create comprehensive tests for the implemented functionality. Focus on unit tests and integration tests.

- [ ] Task 3: Update documentation
      Session name: task-3
      Description: 
        Update relevant documentation including README, API docs, and inline comments.

- [ ] Task 4: Code review preparation
      Session name: task-4
      Description: 
        Prepare code for review, run linting, fix any issues, and ensure quality standards are met.

## In Progress
- [ ] Current task being worked on...
      Session name: current-task
      Description: 
        Description of what is currently being implemented or debugged.

## Quality Checklist
- [ ] Code follows project patterns
- [ ] Tests pass locally
- [ ] Coverage meets threshold
- [ ] Code reviewed
- [ ] Documentation updated

## Session Notes
Add notes about current session, decisions made, next steps...

## Quick Commands
\`\`\`bash
# Run all tasks (creates separate tmux sessions)
tazz run instance-name

# Join specific task session
tazz join instance-name task-1

# List all active sessions
tazz list

# Join main instance session
tazz join instance-name
\`\`\`
`;
  }
  async copyClaudeTemplate(projectPath) {
    try {
      const tazzCliDir = (0, import_path5.dirname)(__dirname);
      const templateDir = (0, import_path5.join)(tazzCliDir, "templates", "claude-template");
      const projectClaudeDir = (0, import_path5.join)(projectPath, ".claude");
      if (await (0, import_fs_extra4.pathExists)(templateDir)) {
        await (0, import_fs_extra4.copy)(templateDir, projectClaudeDir, { overwrite: true });
        await this.updateClaudeSettings(projectPath, projectClaudeDir);
        this.logger.info("Claude configuration copied from template", { templateDir, projectClaudeDir });
      } else {
        this.logger.warn("Claude template not found", { templateDir });
        throw new Error(`Claude template not found at ${templateDir}`);
      }
    } catch (error) {
      this.logger.error("Failed to copy Claude template", { error: error.message });
      throw error;
    }
  }
  async updateClaudeSettings(projectPath, projectClaudeDir) {
    const projectTazzDir = getProjectTazzDir(projectPath);
    const settingsPath = (0, import_path5.join)(projectClaudeDir, "settings.json");
    if (await (0, import_fs_extra4.pathExists)(settingsPath)) {
      const settings = JSON.parse(await (0, import_fs_extra4.readFile)(settingsPath, "utf-8"));
      if (settings.mcpServers?.git) {
        settings.mcpServers.git.args = [
          "mcp-server-git",
          "--repository",
          projectPath
        ];
      }
      if (settings.hooks) {
        Object.keys(settings.hooks).forEach((hookName) => {
          if (settings.hooks[hookName].script) {
            const scriptName = settings.hooks[hookName].script.split("/").pop();
            settings.hooks[hookName].script = (0, import_path5.join)(projectTazzDir, "hooks", scriptName);
          }
        });
      }
      await (0, import_fs_extra4.writeFile)(settingsPath, JSON.stringify(settings, null, 2));
    }
  }
  async setupMCPIntegration(projectPath) {
    const spinner = (0, import_ora.default)("Detecting and configuring MCP servers").start();
    try {
      const mcpService = new MCPIntegrationService(this.logger);
      const mcpConfig = await mcpService.detectAndSetupMCPs();
      await mcpService.setupProjectSpecific(projectPath);
      const connectedServers = mcpService.getConnectedServers();
      spinner.succeed(`MCP integration complete (${connectedServers.length} servers connected)`);
      if (connectedServers.length > 0) {
        console.log(import_chalk.default.gray("    Connected servers:"), import_chalk.default.cyan(connectedServers.join(", ")));
      }
      return mcpService;
    } catch (error) {
      spinner.warn("MCP integration failed, continuing without MCP features");
      this.logger.warn("MCP integration failed", { error: error.message });
      return null;
    }
  }
  async analyzeCodebase(projectPath, mcpService) {
    const spinner = (0, import_ora.default)("Analyzing codebase structure and patterns").start();
    try {
      const analyzer = new CodebaseAnalyzer(
        mcpService || new MCPIntegrationService(this.logger),
        this.logger,
        projectPath
      );
      const analysis = await analyzer.analyzeProject();
      spinner.succeed("Codebase analysis complete");
      console.log(import_chalk.default.gray("    Project type:"), import_chalk.default.cyan(analysis.structure.type));
      console.log(import_chalk.default.gray("    Language:"), import_chalk.default.cyan(analysis.technologies.language));
      if (analysis.technologies.framework) {
        console.log(import_chalk.default.gray("    Framework:"), import_chalk.default.cyan(analysis.technologies.framework));
      }
      console.log(import_chalk.default.gray("    Has tests:"), analysis.testingStrategy.hasTests ? import_chalk.default.green("Yes") : import_chalk.default.yellow("No"));
      return analysis;
    } catch (error) {
      spinner.fail("Codebase analysis failed");
      throw error;
    }
  }
  async generateIntelligentRules(projectPath, analysis) {
    const spinner = (0, import_ora.default)("Generating intelligent rules and patterns").start();
    try {
      const rulesGenerator = new IntelligentRulesGenerator(this.logger, projectPath);
      await rulesGenerator.generateProjectRules(analysis);
      spinner.succeed("Rules generation complete");
      console.log(import_chalk.default.gray("    Generated rules for:"), import_chalk.default.cyan(analysis.technologies.language));
    } catch (error) {
      spinner.fail("Rules generation failed");
      throw error;
    }
  }
  async generateHookScripts(projectPath, analysis) {
    const spinner = (0, import_ora.default)("Setting up Claude Code hooks integration").start();
    try {
      const rulesGenerator = new IntelligentRulesGenerator(this.logger, projectPath);
      await rulesGenerator.generateHookScripts(analysis);
      await this.createSubAgentConfigs(projectPath, analysis);
      spinner.succeed("Hook scripts generated");
      console.log(import_chalk.default.gray("    Created Claude Code integration hooks"));
    } catch (error) {
      spinner.fail("Hook generation failed");
      throw error;
    }
  }
  async createClaudeHooksConfig(projectPath) {
    const projectTazzDir = getProjectTazzDir(projectPath);
    const tazzCliDir = (0, import_path5.dirname)(__dirname);
    const templateDir = (0, import_path5.join)(tazzCliDir, "templates", "claude-template");
    const projectClaudeDir = (0, import_path5.join)(projectPath, ".claude");
    if (await (0, import_fs_extra4.pathExists)(templateDir)) {
      await (0, import_fs_extra4.copy)(templateDir, projectClaudeDir, { overwrite: true });
      const settingsPath = (0, import_path5.join)(projectClaudeDir, "settings.json");
      if (await (0, import_fs_extra4.pathExists)(settingsPath)) {
        const settings = JSON.parse(await (0, import_fs_extra4.readFile)(settingsPath, "utf-8"));
        if (settings.mcpServers?.git) {
          settings.mcpServers.git.args = [
            "mcp-server-git",
            "--repository",
            projectPath
          ];
        }
        if (settings.hooks) {
          Object.keys(settings.hooks).forEach((hookName) => {
            if (settings.hooks[hookName].script) {
              const scriptName = settings.hooks[hookName].script.split("/").pop();
              settings.hooks[hookName].script = (0, import_path5.join)(projectTazzDir, "hooks", scriptName);
            }
          });
        }
        if (settings.subAgents) {
          Object.keys(settings.subAgents).forEach((agentName) => {
            const agent = settings.subAgents[agentName];
            if (agent.rules) {
              const rulesFile = agent.rules.split("/").pop();
              agent.rules = (0, import_path5.join)(projectTazzDir, "rules", rulesFile);
            }
            if (agent.templates) {
              agent.templates = (0, import_path5.join)(projectTazzDir, "templates/");
            }
            if (agent.analysis) {
              agent.analysis = (0, import_path5.join)(projectTazzDir, "analysis.json");
            }
          });
        }
        await (0, import_fs_extra4.writeFile)(settingsPath, JSON.stringify(settings, null, 2));
      }
      this.logger.info("Claude configuration copied from template", { templateDir, projectClaudeDir });
    } else {
      this.logger.warn("Claude template not found", { templateDir });
      throw new Error(`Claude template not found at ${templateDir}`);
    }
  }
  async createSubAgentConfigs(projectPath, analysis) {
    const projectTazzDir = getProjectTazzDir(projectPath);
    const subAgentsDir = (0, import_path5.join)(projectTazzDir, "subagents");
    await (0, import_fs_extra4.ensureDir)(subAgentsDir);
    const subAgentConfigs = {
      "testing-agent.json": {
        name: "Testing Specialist",
        role: "Test automation and quality assurance expert",
        expertise: [
          "Unit testing patterns",
          "Integration test strategies",
          "E2E automation with Playwright",
          "Test coverage optimization",
          "Performance testing",
          "CI/CD test pipeline integration"
        ],
        tools: {
          primary: ["Write", "Edit", "Bash"],
          mcp: ["playwright", "github", "sonarcloud"],
          testing: ["jest", "vitest", "cypress", "playwright"]
        },
        workflows: {
          "create-unit-tests": {
            steps: ["Analyze code", "Generate test structure", "Implement assertions", "Verify coverage"],
            templates: (0, import_path5.join)(projectTazzDir, "templates/unit-test.template")
          },
          "setup-e2e-tests": {
            steps: ["Design user flows", "Create page objects", "Implement scenarios", "Configure CI"],
            templates: (0, import_path5.join)(projectTazzDir, "templates/integration-test.template")
          }
        },
        language: analysis.technologies.language,
        framework: analysis.technologies.framework,
        testingStrategy: analysis.testingStrategy
      },
      "architecture-agent.json": {
        name: "Architecture Analyst",
        role: "System design and code structure expert",
        expertise: [
          "Design pattern analysis",
          "Code architecture assessment",
          "Technical debt identification",
          "Performance optimization",
          "Security analysis",
          "Refactoring strategies"
        ],
        tools: {
          primary: ["Read", "Glob", "Grep"],
          mcp: ["sonarcloud", "context7", "github"],
          analysis: ["ast-parser", "complexity-analyzer"]
        },
        workflows: {
          "analyze-architecture": {
            steps: ["Code structure mapping", "Pattern identification", "Dependency analysis", "Quality metrics"],
            analysis: (0, import_path5.join)(projectTazzDir, "analysis.json")
          },
          "refactor-recommendations": {
            steps: ["Technical debt assessment", "Performance bottlenecks", "Security vulnerabilities", "Improvement plan"],
            rules: (0, import_path5.join)(projectTazzDir, "rules/code-style.json")
          }
        },
        projectType: analysis.projectType,
        technologies: analysis.technologies,
        structure: analysis.structure
      },
      "devops-agent.json": {
        name: "DevOps Engineer",
        role: "CI/CD and infrastructure automation specialist",
        expertise: [
          "CI/CD pipeline optimization",
          "Docker containerization",
          "Build automation",
          "Quality gate enforcement",
          "Deployment strategies",
          "Infrastructure as code"
        ],
        tools: {
          primary: ["Bash", "Write", "Edit"],
          mcp: ["github", "sonarcloud"],
          devops: ["docker", "kubernetes", "terraform"]
        },
        workflows: {
          "setup-ci-pipeline": {
            steps: ["Analyze build process", "Configure workflows", "Setup quality gates", "Deploy automation"],
            rules: (0, import_path5.join)(projectTazzDir, "rules/git-workflow.json")
          },
          "containerize-application": {
            steps: ["Create Dockerfile", "Optimize layers", "Configure compose", "Setup healthchecks"]
          }
        },
        technologies: analysis.technologies,
        buildTools: analysis.buildTools
      }
    };
    await Promise.all(
      Object.entries(subAgentConfigs).map(
        ([filename, config]) => (0, import_fs_extra4.writeFile)((0, import_path5.join)(subAgentsDir, filename), JSON.stringify(config, null, 2))
      )
    );
    this.logger.info("Sub-agent configurations created", { subAgentsDir });
  }
  async setupTestingStrategy(projectPath, analysis) {
    const spinner = (0, import_ora.default)("Setting up testing strategy").start();
    try {
      const projectTazzDir = getProjectTazzDir(projectPath);
      const templatesDir = (0, import_path5.join)(projectTazzDir, "templates");
      const testTemplates = {
        "unit-test.template": this.createUnitTestTemplate(analysis),
        "integration-test.template": analysis.structure.hasAPI ? this.createIntegrationTestTemplate(analysis) : null,
        "e2e-test.template": analysis.structure.hasFrontend ? this.createE2ETestTemplate(analysis) : null
      };
      await Promise.all(
        Object.entries(testTemplates).filter(([, content]) => content !== null).map(
          ([filename, content]) => (0, import_fs_extra4.writeFile)((0, import_path5.join)(templatesDir, filename), content)
        )
      );
      spinner.succeed("Testing strategy configured");
    } catch (error) {
      spinner.fail("Testing strategy setup failed");
      throw error;
    }
  }
  createUnitTestTemplate(analysis) {
    const language = analysis.technologies.language;
    const framework = analysis.testingStrategy.framework;
    if (language === "typescript" || language === "javascript") {
      return `import { describe, it, expect } from '${framework || "vitest"}'
import { {{COMPONENT_NAME}} } from '../src/{{COMPONENT_PATH}}'

describe('{{COMPONENT_NAME}}', () => {
  it('should {{TEST_DESCRIPTION}}', () => {
    // Arrange
    const input = {{TEST_INPUT}}

    // Act
    const result = {{COMPONENT_NAME}}(input)

    // Assert
    expect(result).{{ASSERTION}}
  })
})`;
    }
    return `// Unit test template for {{COMPONENT_NAME}}
// Add your test cases here`;
  }
  createIntegrationTestTemplate(analysis) {
    return `// Integration test template for API endpoints
import request from 'supertest'
import app from '../src/app'

describe('{{API_ENDPOINT}}', () => {
  beforeEach(async () => {
    // Setup test database
  })

  it('should {{ENDPOINT_BEHAVIOR}}', async () => {
    const response = await request(app)
      .{{HTTP_METHOD}}('{{ENDPOINT_PATH}}')
      .send({{REQUEST_BODY}})
      .expect({{EXPECTED_STATUS}})

    expect(response.body).toMatchObject({{EXPECTED_RESPONSE}})
  })
})`;
  }
  createE2ETestTemplate(analysis) {
    const hasPlaywright = analysis.testingStrategy.e2e?.framework === "playwright";
    if (hasPlaywright) {
      return `import { test, expect } from '@playwright/test'

test.describe('{{FEATURE_NAME}}', () => {
  test('should {{TEST_DESCRIPTION}}', async ({ page }) => {
    await page.goto('${analysis.structure.baseURL || "http://localhost:3000"}')
    
    // Test user workflow
    await page.click('{{SELECTOR}}')
    await page.fill('input[name="{{INPUT_NAME}}"]', '{{TEST_VALUE}}')
    
    await expect(page.locator('{{RESULT_SELECTOR}}')).toHaveText('{{EXPECTED_TEXT}}')
  })
})`;
    }
    return `// E2E test template
describe('{{FEATURE_NAME}}', () => {
  it('should complete user workflow', () => {
    // Add E2E test steps
  })
})`;
  }
  async createConfiguration(projectPath, context) {
    const config = {
      version: "1.0.0",
      initialized: (/* @__PURE__ */ new Date()).toISOString(),
      project: {
        name: this.getProjectName(projectPath),
        path: projectPath,
        type: context.analysis?.structure.type || "unknown"
      },
      features: {
        mcpIntegration: context.mcpService !== null,
        codebaseAnalysis: context.analysis !== null,
        intelligentRules: context.analysis !== null,
        hooksIntegration: context.analysis !== null
      },
      settings: {
        maxConcurrentSessions: 10,
        defaultBranch: "main",
        tmuxPrefix: "tazz_",
        agentTimeout: 3e5,
        logLevel: "info",
        autoCommit: false,
        qualityGates: {
          enabled: context.analysis?.quality.hasQualityGates || false,
          coverage: context.analysis?.quality.coverageThreshold || 80
        }
      },
      connectedServices: {
        mcp: context.mcpService?.getConnectedServers() || [],
        git: true,
        tmux: true
      }
    };
    const projectTazzDir = getProjectTazzDir(projectPath);
    await (0, import_fs_extra4.writeFile)(
      (0, import_path5.join)(projectTazzDir, "config.json"),
      JSON.stringify(config, null, 2)
    );
  }
  getProjectName(projectPath) {
    try {
      const packageJson = require((0, import_path5.join)(projectPath, "package.json"));
      return packageJson.name;
    } catch {
      return require("path").basename(projectPath);
    }
  }
  async updateGitignore(projectPath) {
    const gitignorePath = (0, import_path5.join)(projectPath, ".gitignore");
    const tazzEntries = [
      "",
      "# Tazz CLI",
      ".tazz/",
      ".claude/",
      ""
    ].join("\n");
    try {
      if (await (0, import_fs_extra4.pathExists)(gitignorePath)) {
        const existing = await (0, import_fs_extra4.readFile)(gitignorePath, "utf-8");
        if (!existing.includes(".tazz/")) {
          await (0, import_fs_extra4.writeFile)(gitignorePath, existing + tazzEntries);
        }
      } else {
        await (0, import_fs_extra4.writeFile)(gitignorePath, tazzEntries);
      }
    } catch (error) {
      this.logger.warn("Could not update .gitignore", { error: error.message });
    }
  }
};

// src/cli/commands/note.ts
var import_commander2 = require("commander");
var import_chalk2 = __toESM(require("chalk"));
var import_child_process = require("child_process");
var import_fs_extra5 = require("fs-extra");
var import_path6 = require("path");
var NoteCommand = class {
  logger = getLogger();
  build() {
    return new import_commander2.Command("note").description("\u{1F4DD} Open editor to create/edit tasks and prompts").option("-e, --editor <editor>", "Specify editor (code, vim, nano)", "code").option("-t, --template <type>", "Use template (task, prompt, session)", "task").action(async (options) => {
      await this.execute(options);
    });
  }
  async execute(options = {}) {
    console.log("");
    console.log(import_chalk2.default.bold.cyan("\u{1F4DD} Tazz Note Editor"));
    console.log(import_chalk2.default.gray("Creating/editing tasks and prompts..."));
    console.log("");
    const projectPath = process.cwd();
    const notesDir = (0, import_path6.join)(projectPath, ".tazz");
    if (!await (0, import_fs_extra5.pathExists)(notesDir)) {
      console.log(import_chalk2.default.yellow("\u26A0\uFE0F  Project not initialized with Tazz"));
      console.log(import_chalk2.default.gray("Run"), import_chalk2.default.cyan("tazz make"), import_chalk2.default.gray("first to set up the project"));
      return;
    }
    const notesFile = (0, import_path6.join)(notesDir, "tazz-todo.md");
    try {
      await this.ensureNotesFile(notesFile, options.template || "task");
      await this.openInEditor(notesFile, options.editor || "code");
      console.log("");
      console.log(import_chalk2.default.green("\u2705 Notes file ready for editing"));
      console.log(import_chalk2.default.gray("File:"), import_chalk2.default.cyan(notesFile));
      console.log("");
      console.log(import_chalk2.default.bold("Next steps:"));
      console.log(import_chalk2.default.gray("\u2022 Edit your tasks and prompts"));
      console.log(import_chalk2.default.gray("\u2022 Run"), import_chalk2.default.cyan("tazz run <session-name>"), import_chalk2.default.gray("to start working"));
      console.log("");
    } catch (error) {
      this.logger.error("Failed to open notes editor", error);
      console.log(import_chalk2.default.red("\u274C Failed to open editor"));
      console.log(import_chalk2.default.gray("Try specifying a different editor with --editor"));
    }
  }
  async ensureNotesFile(filePath, template) {
    await (0, import_fs_extra5.ensureFile)(filePath);
    let content = "";
    try {
      content = await (0, import_fs_extra5.readFile)(filePath, "utf-8");
    } catch {
    }
    if (!content.trim()) {
      const templateContent = this.getTemplate(template);
      await (0, import_fs_extra5.writeFile)(filePath, templateContent);
      this.logger.info("Created notes file with template", { template, filePath });
    }
  }
  getTemplate(templateType) {
    switch (templateType) {
      case "prompt":
        return `# Tazz Development Prompt

## Context
Describe the current state and what you're working on...

## Goal
What do you want to achieve?

## Tasks
- [ ] Task 1: Specific actionable item
- [ ] Task 2: Another specific task
- [ ] Task 3: Final task

## Constraints
- Technical constraints
- Time constraints  
- Requirements to consider

## Success Criteria
- [ ] How will you know you're done?
- [ ] What should be tested?
- [ ] What documentation is needed?

## Notes
Add any additional context, links, or references...
`;
      case "session":
        return `# Tazz Session Plan

## Session: [SESSION-NAME]
Brief description of this development session...

## Epic/Feature
Link to larger epic or feature this belongs to...

## User Story
As a [user type], I want [functionality] so that [benefit]...

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Development Tasks
- [ ] Setup/configuration
- [ ] Core implementation
- [ ] Testing
- [ ] Documentation
- [ ] Code review

## Technical Notes
- Architecture decisions
- Dependencies
- Integration points

## Definition of Done
- [ ] Code complete
- [ ] Tests passing
- [ ] Peer reviewed
- [ ] Documentation updated
`;
      default:
        return `# Tazz Task Template

## Session Tasks
- [ ] Task 1: Complete implementation
      Session name: task-1
      Description: 
        Implement the main functionality for this feature. This context will be passed to the Claude instance in the tmux session.

- [ ] Task 2: Write tests
      Session name: task-2
      Description: 
        Create comprehensive tests for the implemented functionality. Focus on unit tests and integration tests.

- [ ] Task 3: Update documentation
      Session name: task-3
      Description: 
        Update relevant documentation including README, API docs, and inline comments.

- [ ] Task 4: Code review preparation
      Session name: task-4
      Description: 
        Prepare code for review, run linting, fix any issues, and ensure quality standards are met.

## In Progress
- [ ] Current task being worked on...
      Session name: current-task
      Description: 
        Description of what is currently being implemented or debugged.

## Blocked
- [ ] Task waiting for dependency
      Session name: blocked-task
      Description: 
        Describe what is blocking this task and what needs to be resolved.

## Quality Checklist
- [ ] Code follows project patterns
- [ ] Tests pass locally
- [ ] Coverage meets threshold
- [ ] Code reviewed
- [ ] Documentation updated

## Session Notes
Add notes about current session, decisions made, next steps...

## Quick Commands
\`\`\`bash
# Run all tasks (creates separate tmux sessions)
tazz run instance-name

# Join specific task session
tazz join instance-name task-1

# List all active sessions
tazz list

# Join main instance session
tazz join instance-name
\`\`\`
`;
    }
  }
  async openInEditor(filePath, editor) {
    return new Promise((resolve, reject) => {
      const editorCommands = {
        "code": ["code", filePath],
        "vim": ["vim", filePath],
        "nano": ["nano", filePath],
        "emacs": ["emacs", filePath],
        "subl": ["subl", filePath],
        "atom": ["atom", filePath]
      };
      const command = editorCommands[editor] || ["code", filePath];
      console.log(import_chalk2.default.gray(`Opening with: ${command.join(" ")}`));
      const process2 = (0, import_child_process.spawn)(command[0], command.slice(1), {
        stdio: "inherit",
        shell: true
      });
      process2.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });
      process2.on("error", (error) => {
        reject(error);
      });
    });
  }
};

// src/cli/commands/run.ts
var import_commander3 = require("commander");
var import_chalk5 = __toESM(require("chalk"));
var import_ora3 = __toESM(require("ora"));
var import_fs_extra6 = require("fs-extra");
var import_path7 = require("path");
var import_child_process3 = require("child_process");
var import_util5 = require("util");

// src/cli/ui/tornado.ts
var import_chalk3 = __toESM(require("chalk"));
var TazzAnimation = class {
  frames = [
    // Frame 1 - Formation
    `
        .       *        .        *
        .             .    *         .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .          *          .       *       .      .
     *          .             *        .      *`,
    // Frame 2 - Spinning
    `
        \u2728      \u{1F31F}      \u2728
        .             .    \u2B50        .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .      \u{1F525}  T A Z Z  \u{1F525}   *       .      .
     *          .             *        .      *`,
    // Frame 3 - Intensifying
    `
        \u26A1\u2728    \u{1F31F}\u{1F4AB}    \u26A1\u2728
        .     \u{1F525}      .    \u2B50\u{1F680}      .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .    \u26A1\u{1F525} A G E N T \u{1F525}\u26A1 *       .      .
     *    \u{1F680}    .      \u{1F31F}     *        .    \u2B50`,
    // Frame 4 - Final
    `
        .       *        .        *
        .             .    *         .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .          *          .       *       .      .
     *          .             *        .      *`
  ];
  async show() {
    process.stdout.write("\x1B[2J\x1B[0f");
    for (let i = 0; i < this.frames.length; i++) {
      process.stdout.write("\x1B[H");
      const coloredFrame = import_chalk3.default.cyan(this.frames[i]);
      console.log(coloredFrame);
      if (i === 1) {
        console.log(import_chalk3.default.bold.cyan("    === Tazz CLI Tool ==="));
        console.log(import_chalk3.default.gray("   AI-Powered Task Orchestrator"));
      }
      await this.sleep(600);
    }
    await this.sleep(500);
    process.stdout.write("\x1B[2J\x1B[0f");
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Show a simple spinning tazz animation for shorter animations
   */
  async showSpinner(message = "Processing") {
    const spinnerFrames = ["\u{1F525}", "\u26A1", "\u{1F4AB}", "\u2B50"];
    let frameIndex = 0;
    let isSpinning = true;
    const spinner = setInterval(() => {
      if (!isSpinning) return;
      process.stdout.write("\r");
      process.stdout.write(`${spinnerFrames[frameIndex]} ${import_chalk3.default.cyan(message)}...`);
      frameIndex = (frameIndex + 1) % spinnerFrames.length;
    }, 150);
    return () => {
      isSpinning = false;
      clearInterval(spinner);
      process.stdout.write("\r" + " ".repeat(50) + "\r");
    };
  }
  /**
   * Show a brief tazz burst for quick actions
   */
  async showBurst() {
    const burstFrames = [
      "\u{1F525}",
      "\u26A1",
      "\u{1F525}\u26A1",
      "\u26A1\u{1F525}\u{1F525}",
      "\u{1F525}\u26A1\u26A1\u26A1",
      "\u26A1\u26A1\u26A1",
      "\u26A1\u26A1",
      "\u26A1"
    ];
    for (const frame of burstFrames) {
      process.stdout.write("\r" + import_chalk3.default.cyan(frame));
      await this.sleep(80);
    }
    process.stdout.write("\r" + " ".repeat(20) + "\r");
  }
};

// src/utils/dependencies.ts
var import_child_process2 = require("child_process");
var import_util4 = require("util");
var import_chalk4 = __toESM(require("chalk"));
var import_ora2 = __toESM(require("ora"));
var execAsync = (0, import_util4.promisify)(import_child_process2.exec);
var logger = getLogger();
var DependencyManager = class {
  static installers = {
    linux: [
      {
        checkCommand: "which apt-get",
        installCommand: "sudo apt-get update && sudo apt-get install -y tmux git",
        name: "apt (Ubuntu/Debian)"
      },
      {
        checkCommand: "which yum",
        installCommand: "sudo yum install -y tmux git",
        name: "yum (RHEL/CentOS)"
      },
      {
        checkCommand: "which dnf",
        installCommand: "sudo dnf install -y tmux git",
        name: "dnf (Fedora)"
      },
      {
        checkCommand: "which pacman",
        installCommand: "sudo pacman -S --noconfirm tmux git || pacman -S --noconfirm tmux git",
        name: "pacman (Arch Linux)"
      },
      {
        checkCommand: "which zypper",
        installCommand: "sudo zypper install -y tmux git",
        name: "zypper (openSUSE)"
      }
    ],
    darwin: [
      {
        checkCommand: "which brew",
        installCommand: "brew install tmux git",
        name: "Homebrew"
      },
      {
        checkCommand: "which port",
        installCommand: "sudo port install tmux git",
        name: "MacPorts"
      }
    ],
    win32: [
      {
        checkCommand: "where choco",
        installCommand: "choco install tmux git -y",
        name: "Chocolatey"
      },
      {
        checkCommand: "where winget",
        installCommand: "winget install tmux git",
        name: "WinGet"
      }
    ]
  };
  static async checkDependency(command) {
    try {
      try {
        await execAsync(`${command} --version`);
        return true;
      } catch {
        try {
          await execAsync(`${command} -V`);
          return true;
        } catch {
          await execAsync(`which ${command}`);
          return true;
        }
      }
    } catch {
      return false;
    }
  }
  static async installTmux() {
    const platform = process.platform;
    const installers = this.installers[platform] || [];
    console.log("");
    console.log(import_chalk4.default.yellow("\u{1F527} Installing tmux automatically..."));
    for (const installer of installers) {
      try {
        await execAsync(installer.checkCommand);
        const spinner = (0, import_ora2.default)(`Installing tmux using ${installer.name}`).start();
        try {
          let tmuxCommand = installer.installCommand.replace("tmux git", "tmux");
          if (installer.name.includes("pacman")) {
            try {
              await execAsync("sudo pacman -S --noconfirm tmux");
            } catch {
              await execAsync("pacman -S --noconfirm tmux");
            }
          } else {
            await execAsync(tmuxCommand);
          }
          spinner.succeed(`tmux installed successfully using ${installer.name}`);
          await new Promise((resolve) => setTimeout(resolve, 1e3));
          if (await this.checkDependency("tmux")) {
            console.log(import_chalk4.default.green("\u2705 tmux is now available"));
            return true;
          } else {
            spinner.warn("Installation completed but tmux still not detected");
            console.log(import_chalk4.default.gray("   You may need to restart your shell or source your profile"));
          }
        } catch (installError) {
          spinner.fail(`Failed to install using ${installer.name}`);
          logger.debug("Installation failed", installError);
          console.log(import_chalk4.default.gray(`   Error: ${installError.message}`));
          continue;
        }
      } catch {
        continue;
      }
    }
    console.log("");
    console.log(import_chalk4.default.yellow("\u26A0\uFE0F  Automatic installation failed"));
    console.log(import_chalk4.default.bold("Manual installation options:"));
    switch (platform) {
      case "linux":
        console.log(import_chalk4.default.gray("  Ubuntu/Debian:"), import_chalk4.default.cyan("sudo apt-get install tmux"));
        console.log(import_chalk4.default.gray("  RHEL/CentOS:"), import_chalk4.default.cyan("sudo yum install tmux"));
        console.log(import_chalk4.default.gray("  Fedora:"), import_chalk4.default.cyan("sudo dnf install tmux"));
        console.log(import_chalk4.default.gray("  Arch Linux:"), import_chalk4.default.cyan("sudo pacman -S tmux"));
        break;
      case "darwin":
        console.log(import_chalk4.default.gray("  Homebrew:"), import_chalk4.default.cyan("brew install tmux"));
        console.log(import_chalk4.default.gray("  MacPorts:"), import_chalk4.default.cyan("sudo port install tmux"));
        break;
      case "win32":
        console.log(import_chalk4.default.gray("  Chocolatey:"), import_chalk4.default.cyan("choco install tmux"));
        console.log(import_chalk4.default.gray("  WinGet:"), import_chalk4.default.cyan("winget install tmux"));
        break;
    }
    return false;
  }
  static async ensureDependencies() {
    const dependencies = [
      { command: "git", name: "Git" },
      { command: "tmux", name: "tmux" }
    ];
    const missing = [];
    for (const dep of dependencies) {
      if (!await this.checkDependency(dep.command)) {
        missing.push(dep);
      }
    }
    if (missing.length === 0) {
      return true;
    }
    console.log("");
    console.log(import_chalk4.default.yellow(`\u{1F50D} Missing dependencies: ${missing.map((d) => d.name).join(", ")}`));
    if (missing.some((d) => d.command === "tmux")) {
      const installed = await this.installTmux();
      if (!installed) {
        return false;
      }
    }
    if (missing.some((d) => d.command === "git") && !await this.checkDependency("git")) {
      console.log("");
      console.log(import_chalk4.default.red("\u274C Git is required but not installed"));
      console.log(import_chalk4.default.gray("Please install Git first: https://git-scm.com/downloads"));
      return false;
    }
    return true;
  }
};

// src/cli/commands/run.ts
var execAsync2 = (0, import_util5.promisify)(import_child_process3.exec);
var RunCommand = class {
  logger = getLogger();
  build() {
    return new import_commander3.Command("run").description("\u{1F680} Start a development session with git worktree and tmux").argument("<instance-name>", "Instance name (e.g., feature-auth, JIRA-123)").action(async (sessionName) => {
      await this.execute(sessionName);
    });
  }
  async execute(sessionName) {
    const animation = new TazzAnimation();
    await animation.show();
    console.log("");
    console.log(import_chalk5.default.bold.cyan(`\u{1F680} Starting session: ${sessionName}`));
    console.log("");
    try {
      await this.checkProjectInitialized();
      if (!await DependencyManager.ensureDependencies()) {
        throw new Error("Required dependencies are missing");
      }
      const tasks = await this.loadTasks();
      if (tasks.length > 0) {
        console.log(import_chalk5.default.bold("\u{1F4CB} Session Tasks:"));
        tasks.forEach((task, i) => {
          console.log(import_chalk5.default.gray(`   ${i + 1}.`), import_chalk5.default.cyan(task.name));
          if (task.description) {
            console.log(import_chalk5.default.gray(`      ${task.description.substring(0, 80)}...`));
          }
        });
        console.log("");
      }
      const worktreePath = await this.createWorktree(sessionName);
      if (tasks.length > 0) {
        await this.createTazzProcessesForTasks(sessionName, worktreePath, tasks);
      } else {
        await this.createTmuxSession(sessionName, worktreePath, "Main development session");
      }
      await this.saveSessionInfo(sessionName, {
        worktreePath,
        tasks,
        branch: `feature/${sessionName}`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log("");
      console.log(import_chalk5.default.green("\u2705 Sessions started successfully!"));
      console.log("");
      console.log(import_chalk5.default.bold("\u{1F4CD} Session Details:"));
      console.log(import_chalk5.default.gray("   Instance:"), import_chalk5.default.cyan(sessionName));
      console.log(import_chalk5.default.gray("   Worktree:"), import_chalk5.default.cyan(worktreePath));
      if (tasks.length > 0) {
        console.log(import_chalk5.default.gray("   Tazz Processes:"));
        tasks.forEach((task, i) => {
          const taskSessionName = task.sessionName || `task${i + 1}`;
          const fullSessionId = `${sessionName}_${taskSessionName}`;
          console.log(import_chalk5.default.gray(`     ${i + 1}.`), import_chalk5.default.cyan(fullSessionId), import_chalk5.default.gray(`(${task.name})`));
        });
      } else {
        console.log(import_chalk5.default.gray("   Tmux Session:"), import_chalk5.default.cyan(`tazz_${sessionName}`));
      }
      console.log("");
      console.log(import_chalk5.default.bold("\u{1F517} Next Steps:"));
      if (tasks.length > 0) {
        console.log(import_chalk5.default.gray(`\u2022 ${tasks.length} separate Tazz processes created (detached)`));
        const firstTaskSessionName = tasks[0]?.sessionName || "task1";
        const firstFullSessionId = `${sessionName}_${firstTaskSessionName}`;
        console.log(import_chalk5.default.gray("\u2022 Join specific process:"), import_chalk5.default.cyan(`tazz join ${firstFullSessionId}`));
        console.log(import_chalk5.default.gray("\u2022 List all processes:"), import_chalk5.default.cyan("tazz list"));
        console.log(import_chalk5.default.gray("\u2022 Delete a process:"), import_chalk5.default.cyan(`tazz delete ${firstFullSessionId}`));
      } else {
        console.log(import_chalk5.default.gray("\u2022 Session created (detached)"));
        console.log(import_chalk5.default.gray("\u2022 Join session:"), import_chalk5.default.cyan(`tazz join ${sessionName}`));
        console.log(import_chalk5.default.gray("\u2022 List all sessions:"), import_chalk5.default.cyan("tazz list"));
      }
      console.log(import_chalk5.default.gray("\u2022 Edit tasks:"), import_chalk5.default.cyan("tazz note"));
      console.log("");
    } catch (error) {
      this.logger.error("Session creation failed", error, { sessionName });
      console.log("");
      console.log(import_chalk5.default.red("\u274C Failed to start session"));
      console.log(import_chalk5.default.red(`   ${error.message}`));
      if (error.message.includes("dependencies")) {
        console.log("");
        console.log(import_chalk5.default.yellow("\u{1F4A1} Suggestions:"));
        console.log(import_chalk5.default.gray("   \u2022 Install dependencies:"), import_chalk5.default.cyan("tazz health --fix"));
        console.log(import_chalk5.default.gray("   \u2022 Check system status:"), import_chalk5.default.cyan("tazz health"));
      }
      console.log("");
      process.exit(1);
    }
  }
  async checkProjectInitialized() {
    const tazzDir = (0, import_path7.join)(process.cwd(), ".tazz");
    if (!await (0, import_fs_extra6.pathExists)(tazzDir)) {
      throw new Error('Project not initialized. Run "tazz make" first.');
    }
  }
  async loadTasks() {
    try {
      const notesPath = (0, import_path7.join)(process.cwd(), ".tazz", "tazz-todo.md");
      if (await (0, import_fs_extra6.pathExists)(notesPath)) {
        const content = await (0, import_fs_extra6.readFile)(notesPath, "utf-8");
        const tasks = [];
        const lines = content.split("\n");
        let i = 0;
        while (i < lines.length) {
          const taskMatch = lines[i].match(/^- \[ \] (.+)/);
          if (taskMatch) {
            const taskName = taskMatch[1];
            let description = "";
            let sessionName = "";
            i++;
            while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^- \[ \]/)) {
              const line = lines[i].trim();
              const sessionMatch = line.match(/Session name:\s*(.+)/);
              if (sessionMatch) {
                sessionName = sessionMatch[1].trim();
              }
              if (line === "Description:") {
                i++;
                while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^- \[ \]/) && !lines[i].includes("Session name:")) {
                  description += lines[i].trim() + " ";
                  i++;
                }
                i--;
              }
              i++;
            }
            i--;
            tasks.push({
              name: taskName,
              description: description.trim() || `Work on: ${taskName}`,
              sessionName: sessionName || taskName.toLowerCase().replace(/[^a-z0-9]/g, "-")
            });
          }
          i++;
        }
        return tasks.slice(0, 5);
      }
    } catch (error) {
      this.logger.debug("Could not load tasks from notes", error);
    }
    return [];
  }
  async createWorktree(sessionName) {
    const spinner = (0, import_ora3.default)("Creating git worktree").start();
    try {
      const branchName = `feature/${sessionName}`;
      const worktreePath = (0, import_path7.join)("..", sessionName);
      await execAsync2(`git worktree add ${worktreePath} -b ${branchName}`);
      spinner.succeed("Git worktree created");
      return (0, import_path7.join)(process.cwd(), worktreePath);
    } catch (error) {
      spinner.fail("Failed to create worktree");
      throw new Error(`Git worktree creation failed: ${error.message}`);
    }
  }
  async createTazzProcessesForTasks(sessionName, worktreePath, tasks) {
    const spinner = (0, import_ora3.default)(`Creating ${tasks.length} separate Tazz processes`).start();
    try {
      const processPromises = tasks.map(async (task, index) => {
        const taskSessionName = task.sessionName || `task${index + 1}`;
        const fullSessionId = `${sessionName}_${taskSessionName}`;
        const tmuxSessionId = `tazz_${fullSessionId}`;
        await execAsync2(`tmux new-session -d -s ${tmuxSessionId} -c "${worktreePath}"`);
        await this.setupTaskSession(tmuxSessionId, task, fullSessionId);
        return {
          taskName: taskSessionName,
          sessionId: fullSessionId,
          tmuxSession: tmuxSessionId,
          task
        };
      });
      const createdProcesses = await Promise.all(processPromises);
      spinner.succeed(`Created ${tasks.length} Tazz processes`);
      return createdProcesses;
    } catch (error) {
      spinner.fail("Failed to create Tazz processes");
      throw new Error(`Tazz processes creation failed: ${error.message}`);
    }
  }
  async setupTaskSession(tmuxSessionId, task, sessionId) {
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'clear' Enter`);
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo "\u{1F680} Tazz Process: ${sessionId}"' Enter`);
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo "\u{1F4C2} Working directory: $(pwd)"' Enter`);
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo "\u{1F4DD} Task: ${task.name}"' Enter`);
    if (task.description) {
      await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo "\u{1F4A1} Context: ${task.description}"' Enter`);
    }
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo ""' Enter`);
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo "This is an independent Tazz process."' Enter`);
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo "Use: tazz join ${sessionId} to attach"' Enter`);
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo "Use: tazz list to see all processes"' Enter`);
    await execAsync2(`tmux send-keys -t ${tmuxSessionId} 'echo ""' Enter`);
  }
  async createTmuxSession(sessionName, worktreePath, description) {
    const spinner = (0, import_ora3.default)("Creating tmux session").start();
    try {
      const sessionId = `tazz_${sessionName}`;
      await execAsync2(`tmux new-session -d -s ${sessionId} -c "${worktreePath}"`);
      await execAsync2(`tmux send-keys -t ${sessionId} 'clear' Enter`);
      await execAsync2(`tmux send-keys -t ${sessionId} 'echo "\u{1F680} Tazz Session: ${sessionName}"' Enter`);
      await execAsync2(`tmux send-keys -t ${sessionId} 'echo "\u{1F4C2} Working directory: $(pwd)"' Enter`);
      if (description) {
        await execAsync2(`tmux send-keys -t ${sessionId} 'echo "\u{1F4A1} Context: ${description}"' Enter`);
      }
      await execAsync2(`tmux send-keys -t ${sessionId} 'echo "\u{1F4DD} Edit tasks: tazz note"' Enter`);
      await execAsync2(`tmux send-keys -t ${sessionId} 'echo ""' Enter`);
      spinner.succeed("Tmux session created");
    } catch (error) {
      spinner.fail("Failed to create tmux session");
      throw new Error(`Tmux session creation failed: ${error.message}`);
    }
  }
  async attachTmuxSession(sessionName) {
    try {
      const sessionId = `tazz_${sessionName}`;
      if (process.env.TMUX) {
        console.log(import_chalk5.default.yellow("\u26A0\uFE0F  Already inside a tmux session"));
        console.log(import_chalk5.default.gray("   Switch to session:"), import_chalk5.default.cyan(`tmux switch-client -t ${sessionId}`));
        return;
      }
      const { spawn: spawn2 } = require("child_process");
      const tmux = spawn2("tmux", ["attach-session", "-t", sessionId], {
        stdio: "inherit",
        detached: false
      });
      tmux.on("exit", (code) => {
        process.exit(code || 0);
      });
    } catch (error) {
      console.log(import_chalk5.default.yellow("\u26A0\uFE0F  Could not attach to tmux session"));
      console.log(import_chalk5.default.gray("   Attach manually:"), import_chalk5.default.cyan(`tmux attach-session -t tazz_${sessionName}`));
    }
  }
  async saveSessionInfo(sessionName, info) {
    try {
      const projectTazzDir = getProjectTazzDir(process.cwd());
      const sessionsPath = (0, import_path7.join)(projectTazzDir, "sessions.json");
      let sessions = { sessions: [] };
      try {
        const content = await (0, import_fs_extra6.readFile)(sessionsPath, "utf-8");
        sessions = JSON.parse(content);
      } catch {
      }
      const existingIndex = sessions.sessions.findIndex((s) => s.id === sessionName);
      const sessionData = {
        id: sessionName,
        ...info,
        status: "active",
        lastActive: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (existingIndex >= 0) {
        sessions.sessions[existingIndex] = sessionData;
      } else {
        sessions.sessions.push(sessionData);
      }
      sessions.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
      this.logger.info("Session info saved", { sessionName, info });
    } catch (error) {
      this.logger.warn("Could not save session info", error);
    }
  }
};

// src/cli/commands/list.ts
var import_commander4 = require("commander");
var import_chalk6 = __toESM(require("chalk"));
var import_child_process4 = require("child_process");
var import_util6 = require("util");
var execAsync3 = (0, import_util6.promisify)(import_child_process4.exec);
var ListCommand = class {
  logger = getLogger();
  build() {
    return new import_commander4.Command("list").alias("ls").description("\u{1F4CB} List all active Tazz processes").option("-v, --verbose", "Show detailed session information").action(async (options) => {
      await this.execute(options);
    });
  }
  async execute(options = {}) {
    console.log("");
    console.log(import_chalk6.default.bold.cyan("\u{1F4CB} Active Tazz Processes"));
    console.log("");
    try {
      const sessions = await this.getTmuxSessions();
      if (sessions.length === 0) {
        console.log(import_chalk6.default.yellow("\u{1F4ED} No active processes found"));
        console.log("");
        console.log(import_chalk6.default.gray("Start new processes with:"), import_chalk6.default.cyan("tazz run <instance-name>"));
        console.log("");
        return;
      }
      const grouped = this.groupSessionsByInstance(sessions);
      Object.entries(grouped).forEach(([project, projectSessions]) => {
        console.log(import_chalk6.default.bold.green(`\u{1F680} Instance: ${project}`));
        console.log("");
        if (projectSessions.tasks.length > 0) {
          console.log(import_chalk6.default.bold("  \u{1F4CB} Task Processes:"));
          projectSessions.tasks.forEach((session, i) => {
            console.log(`    ${i + 1}. ${import_chalk6.default.cyan(session.fullProcessId || session.taskName)} ${import_chalk6.default.gray(`(${session.taskName})`)}`);
            if (options.verbose && session.created) {
              console.log(`       ${import_chalk6.default.gray("Created:")} ${session.created}`);
            }
            console.log(`       ${import_chalk6.default.gray("Join with:")} ${import_chalk6.default.cyan(`tazz join ${session.fullProcessId || session.taskName}`)}`);
          });
          console.log("");
        }
        if (projectSessions.main.length > 0) {
          console.log(import_chalk6.default.bold("  \u{1F527} Main Sessions:"));
          projectSessions.main.forEach((session, i) => {
            console.log(`    ${i + 1}. ${import_chalk6.default.cyan(session.fullProcessId || session.project)}`);
            if (options.verbose && session.created) {
              console.log(`       ${import_chalk6.default.gray("Created:")} ${session.created}`);
            }
            console.log(`       ${import_chalk6.default.gray("Join with:")} ${import_chalk6.default.cyan(`tazz join ${session.fullProcessId || session.project}`)}`);
          });
          console.log("");
        }
      });
      this.showQuickActions(sessions);
    } catch (error) {
      this.logger.error("Failed to list sessions", error);
      console.log(import_chalk6.default.red("\u274C Failed to list sessions"));
      console.log(import_chalk6.default.red(`   ${error.message}`));
      process.exit(1);
    }
  }
  async getTmuxSessions() {
    try {
      const { stdout } = await execAsync3('tmux list-sessions -F "#{session_name}:#{session_created}" 2>/dev/null || true');
      if (!stdout.trim()) {
        return [];
      }
      const sessions = stdout.trim().split("\n").filter((line) => line.includes("tazz_")).map((line) => {
        const [sessionId, created] = line.split(":");
        const createdDate = new Date(parseInt(created) * 1e3).toLocaleString();
        const match = sessionId.match(/^tazz_(.+)$/);
        if (match) {
          const fullId = match[1];
          const lastUnderscoreIndex = fullId.lastIndexOf("_");
          if (lastUnderscoreIndex > 0) {
            const instance = fullId.substring(0, lastUnderscoreIndex);
            const taskName = fullId.substring(lastUnderscoreIndex + 1);
            return {
              sessionId,
              created: createdDate,
              project: instance,
              taskName,
              fullProcessId: fullId
            };
          } else {
            return {
              sessionId,
              created: createdDate,
              project: fullId,
              fullProcessId: fullId
            };
          }
        }
        return {
          sessionId,
          created: createdDate
        };
      });
      return sessions;
    } catch (error) {
      return [];
    }
  }
  groupSessionsByInstance(sessions) {
    const grouped = {};
    sessions.forEach((session) => {
      const project = session.project || "unknown";
      if (!grouped[project]) {
        grouped[project] = { tasks: [], main: [] };
      }
      if (session.taskName) {
        grouped[project].tasks.push(session);
      } else {
        grouped[project].main.push(session);
      }
    });
    return grouped;
  }
  showQuickActions(sessions) {
    console.log(import_chalk6.default.bold("\u{1F680} Quick Actions:"));
    console.log("");
    if (sessions.length > 0) {
      const taskSession = sessions.find((s) => s.taskName);
      if (taskSession) {
        console.log(import_chalk6.default.gray("  Join task process:"), import_chalk6.default.cyan(`tazz join ${taskSession.fullProcessId}`));
      }
      const mainSession = sessions.find((s) => !s.taskName);
      if (mainSession && mainSession.project) {
        console.log(import_chalk6.default.gray("  Join main session:"), import_chalk6.default.cyan(`tazz join ${mainSession.fullProcessId || mainSession.project}`));
      }
      console.log(import_chalk6.default.gray("  Delete a process:"), import_chalk6.default.cyan(`tazz delete <process-id>`));
    }
    console.log(import_chalk6.default.gray("  Create new processes:"), import_chalk6.default.cyan("tazz run <instance-name>"));
    console.log("");
  }
};

// src/cli/commands/join.ts
var import_commander5 = require("commander");
var import_chalk7 = __toESM(require("chalk"));
var import_child_process5 = require("child_process");
var import_util7 = require("util");
var execAsync4 = (0, import_util7.promisify)(import_child_process5.exec);
var JoinCommand = class {
  logger = getLogger();
  build() {
    return new import_commander5.Command("join").alias("attach").description("\u{1F517} Join an existing Tazz process").argument("<process-id>", "Process ID to join (e.g., instance_task-1)").action(async (processId) => {
      await this.execute(processId);
    });
  }
  async execute(processId) {
    console.log("");
    try {
      const tmuxSessionName = `tazz_${processId}`;
      console.log(import_chalk7.default.cyan(`\u{1F517} Joining Tazz process: ${processId}`));
      try {
        await execAsync4(`tmux has-session -t ${tmuxSessionName}`);
      } catch (error) {
        console.log(import_chalk7.default.red(`\u274C Tazz process not found: ${processId}`));
        await this.listAvailableSessions();
        process.exit(1);
      }
      await this.joinTmuxSession(tmuxSessionName);
    } catch (error) {
      console.log(import_chalk7.default.red(`\u274C Failed to join session: ${error.message}`));
      this.logger.error("Join failed", error);
      process.exit(1);
    }
  }
  async joinTmuxSession(sessionName) {
    try {
      if (process.env.TMUX) {
        console.log(import_chalk7.default.yellow("\u26A0\uFE0F  Already inside a tmux session"));
        console.log(import_chalk7.default.gray("   Switch to session:"), import_chalk7.default.cyan(`tmux switch-client -t ${sessionName}`));
        return;
      }
      const { spawn: spawn2 } = require("child_process");
      console.log(import_chalk7.default.green(`\u2705 Joining Tazz process: ${sessionName}`));
      const tmux = spawn2("tmux", ["attach-session", "-t", sessionName], {
        stdio: "inherit",
        detached: false
      });
      tmux.on("exit", (code) => {
        process.exit(code || 0);
      });
    } catch (error) {
      console.log(import_chalk7.default.yellow("\u26A0\uFE0F  Could not join tmux session"));
      console.log(import_chalk7.default.gray("   Try manually:"), import_chalk7.default.cyan(`tmux attach-session -t ${sessionName}`));
    }
  }
  async listAvailableSessions() {
    try {
      const { stdout } = await execAsync4("tmux list-sessions | grep tazz");
      console.log("");
      console.log(import_chalk7.default.yellow("Available Tazz processes:"));
      console.log(import_chalk7.default.gray(stdout));
    } catch {
      console.log(import_chalk7.default.gray("No active Tazz processes found"));
    }
  }
};

// src/cli/commands/stop.ts
var import_commander6 = require("commander");
var import_chalk8 = __toESM(require("chalk"));

// src/core/storage/SessionStore.ts
var import_fs_extra7 = require("fs-extra");
var import_path8 = require("path");
var SessionStore = class {
  sessionsPath;
  constructor(projectPath = process.cwd()) {
    this.sessionsPath = (0, import_path8.join)(projectPath, ".tazz", "sessions.json");
  }
  async getAllSessions() {
    try {
      if (!await (0, import_fs_extra7.pathExists)(this.sessionsPath)) {
        return [];
      }
      const data = await (0, import_fs_extra7.readFile)(this.sessionsPath, "utf-8");
      const sessionData = JSON.parse(data);
      return sessionData.sessions || [];
    } catch (error) {
      throw new SessionError("Failed to read sessions file", {
        path: this.sessionsPath
      }, error);
    }
  }
  async getSession(sessionId) {
    const sessions = await this.getAllSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }
  async saveSession(session) {
    try {
      const sessions = await this.getAllSessions();
      const existingIndex = sessions.findIndex((s) => s.id === session.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      const sessionData = {
        sessions,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
      await (0, import_fs_extra7.ensureFile)(this.sessionsPath);
      await (0, import_fs_extra7.writeFile)(this.sessionsPath, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      throw new SessionError("Failed to save session", {
        sessionId: session.id,
        path: this.sessionsPath
      }, error);
    }
  }
  async removeSession(sessionId) {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter((s) => s.id !== sessionId);
      const sessionData = {
        sessions: filteredSessions,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
      await (0, import_fs_extra7.writeFile)(this.sessionsPath, JSON.stringify(sessionData, null, 2));
    } catch (error) {
      throw new SessionError("Failed to remove session", {
        sessionId,
        path: this.sessionsPath
      }, error);
    }
  }
  async updateSessionStatus(sessionId, status) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new SessionError(`Session ${sessionId} not found`);
    }
    session.status = status;
    session.lastActive = /* @__PURE__ */ new Date();
    await this.saveSession(session);
  }
};

// src/cli/commands/stop.ts
var StopCommand = class {
  logger = getLogger();
  build() {
    return new import_commander6.Command("stop").description("\u23F8\uFE0F  Stop a Tazz session (keeps worktree)").argument("<session-id>", "Session identifier to stop").action(async (sessionId) => {
      await this.execute(sessionId);
    });
  }
  async execute(sessionId) {
    console.log("");
    console.log(import_chalk8.default.yellow(`\u23F8\uFE0F  Stopping session: ${sessionId}`));
    try {
      const sessionStore = new SessionStore();
      await sessionStore.updateSessionStatus(sessionId, "stopped" /* STOPPED */);
      console.log(import_chalk8.default.green(`\u2705 Session ${sessionId} stopped`));
      console.log(import_chalk8.default.gray(`   Use 'tazz join ${sessionId}' to resume`));
    } catch (error) {
      console.log(import_chalk8.default.red(`\u274C Failed to stop session: ${error.message}`));
      process.exit(1);
    }
  }
};

// src/cli/commands/delete.ts
var import_commander7 = require("commander");
var import_chalk9 = __toESM(require("chalk"));
var import_inquirer = __toESM(require("inquirer"));
var import_child_process6 = require("child_process");
var import_util8 = require("util");
var execAsync5 = (0, import_util8.promisify)(import_child_process6.exec);
var DeleteCommand = class {
  logger = getLogger();
  build() {
    return new import_commander7.Command("delete").alias("rm").alias("destroy").description("\u{1F5D1}\uFE0F  Delete a Tazz process").argument("<process-id>", "Process ID to delete (e.g., instance_task-1)").option("-f, --force", "Skip confirmation prompt").action(async (processId, options) => {
      await this.execute(processId, options);
    });
  }
  async execute(processId, options = {}) {
    console.log("");
    try {
      const tmuxSessionName = `tazz_${processId}`;
      try {
        await execAsync5(`tmux has-session -t ${tmuxSessionName}`);
      } catch (error) {
        console.log(import_chalk9.default.red(`\u274C Tazz process not found: ${processId}`));
        await this.listAvailableProcesses();
        process.exit(1);
      }
      if (!options.force) {
        const { confirmed } = await import_inquirer.default.prompt([{
          type: "confirm",
          name: "confirmed",
          message: `Are you sure you want to delete Tazz process ${processId}? This will kill the tmux session.`,
          default: false
        }]);
        if (!confirmed) {
          console.log(import_chalk9.default.yellow("\u274C Deletion cancelled"));
          return;
        }
      }
      console.log(import_chalk9.default.yellow(`\u{1F5D1}\uFE0F  Deleting Tazz process: ${processId}`));
      await execAsync5(`tmux kill-session -t ${tmuxSessionName}`);
      console.log(import_chalk9.default.green(`\u2705 Tazz process ${processId} deleted`));
    } catch (error) {
      console.log(import_chalk9.default.red(`\u274C Failed to delete process: ${error.message}`));
      this.logger.error("Delete failed", error);
      process.exit(1);
    }
  }
  async listAvailableProcesses() {
    try {
      const { stdout } = await execAsync5("tmux list-sessions | grep tazz");
      console.log("");
      console.log(import_chalk9.default.yellow("Available Tazz processes:"));
      console.log(import_chalk9.default.gray(stdout));
    } catch {
      console.log(import_chalk9.default.gray("No active Tazz processes found"));
    }
  }
};

// src/cli/commands/health.ts
var import_commander8 = require("commander");
var import_chalk10 = __toESM(require("chalk"));
var import_ora4 = __toESM(require("ora"));
var import_child_process7 = require("child_process");
var import_util9 = require("util");
var import_fs_extra8 = require("fs-extra");
var execAsync6 = (0, import_util9.promisify)(import_child_process7.exec);
var HealthCommand = class {
  logger = getLogger();
  build() {
    return new import_commander8.Command("health").description("\u{1F3E5} Check Tazz CLI health and system dependencies").option("--fix", "Automatically fix issues where possible").option("--verbose", "Show detailed diagnostic information").action(async (options) => {
      await this.execute(options);
    });
  }
  async execute(options = {}) {
    console.log("");
    console.log(import_chalk10.default.bold.cyan("\u{1F3E5} Tazz CLI Health Check"));
    console.log(import_chalk10.default.gray("Checking system dependencies and configuration..."));
    console.log("");
    const healthChecks = [
      { name: "Node.js", check: () => this.checkNode() },
      { name: "npm/yarn", check: () => this.checkPackageManager() },
      { name: "Git", check: () => this.checkGit() },
      { name: "tmux", check: () => this.checkTmux(options.fix) },
      { name: "Claude Code", check: () => this.checkClaudeCode() },
      { name: "Tazz Configuration", check: () => this.checkTazzConfig() },
      { name: "System Resources", check: () => this.checkSystemResources() },
      { name: "Network Connectivity", check: () => this.checkNetwork() }
    ];
    const results = [];
    for (const healthCheck of healthChecks) {
      const spinner = (0, import_ora4.default)(`Checking ${healthCheck.name}`).start();
      try {
        const result = await healthCheck.check();
        results.push({ name: healthCheck.name, ...result });
        if (result.status === "pass") {
          spinner.succeed(import_chalk10.default.green(`${healthCheck.name}: ${result.message}`));
        } else if (result.status === "warn") {
          spinner.warn(import_chalk10.default.yellow(`${healthCheck.name}: ${result.message}`));
        } else {
          spinner.fail(import_chalk10.default.red(`${healthCheck.name}: ${result.message}`));
        }
        if (options.verbose && result.details) {
          console.log(import_chalk10.default.gray(`   ${result.details}`));
        }
      } catch (error) {
        results.push({
          name: healthCheck.name,
          status: "fail",
          message: `Check failed: ${error.message}`
        });
        spinner.fail(import_chalk10.default.red(`${healthCheck.name}: Check failed`));
      }
    }
    console.log("");
    this.printHealthSummary(results);
    const failedChecks = results.filter((r) => r.status === "fail");
    const warningChecks = results.filter((r) => r.status === "warn");
    if (failedChecks.length > 0 || warningChecks.length > 0) {
      console.log("");
      console.log(import_chalk10.default.bold("\u{1F527} Recommendations:"));
      for (const check of [...failedChecks, ...warningChecks]) {
        console.log("");
        console.log(import_chalk10.default.bold(`${check.name}:`));
        console.log(import_chalk10.default.gray(`  Issue: ${check.message}`));
        const recommendation = this.getRecommendation(check.name, check.status);
        if (recommendation) {
          console.log(import_chalk10.default.cyan(`  Fix: ${recommendation}`));
        }
      }
    }
    if (options.fix && failedChecks.length > 0) {
      console.log("");
      console.log(import_chalk10.default.yellow("\u{1F528} Attempting to fix issues automatically..."));
      await this.autoFix(failedChecks);
    }
    console.log("");
  }
  async checkNode() {
    try {
      const { stdout } = await execAsync6("node --version");
      const version = stdout.trim();
      const majorVersion = parseInt(version.replace("v", "").split(".")[0]);
      if (majorVersion >= 18) {
        return {
          status: "pass",
          message: `${version} (supported)`,
          details: `Node.js ${version} is compatible with Tazz CLI`
        };
      } else if (majorVersion >= 16) {
        return {
          status: "warn",
          message: `${version} (outdated but supported)`,
          details: "Consider upgrading to Node.js 18+ for best performance"
        };
      } else {
        return {
          status: "fail",
          message: `${version} (unsupported)`,
          details: "Tazz CLI requires Node.js 16+ (18+ recommended)"
        };
      }
    } catch (error) {
      return {
        status: "fail",
        message: "Node.js not found",
        details: "Install Node.js from https://nodejs.org"
      };
    }
  }
  async checkPackageManager() {
    try {
      const { stdout: npmVersion } = await execAsync6("npm --version");
      try {
        const { stdout: yarnVersion } = await execAsync6("yarn --version");
        return {
          status: "pass",
          message: `npm ${npmVersion.trim()}, yarn ${yarnVersion.trim()}`,
          details: "Both npm and yarn are available"
        };
      } catch {
        return {
          status: "pass",
          message: `npm ${npmVersion.trim()}`,
          details: "npm is available (yarn not installed)"
        };
      }
    } catch (error) {
      return {
        status: "fail",
        message: "No package manager found",
        details: "Install npm (comes with Node.js) or yarn"
      };
    }
  }
  async checkGit() {
    try {
      const { stdout } = await execAsync6("git --version");
      const version = stdout.trim().replace("git version ", "");
      try {
        const { stdout: userName } = await execAsync6("git config user.name");
        const { stdout: userEmail } = await execAsync6("git config user.email");
        if (userName.trim() && userEmail.trim()) {
          return {
            status: "pass",
            message: `${version} (configured)`,
            details: `User: ${userName.trim()} <${userEmail.trim()}>`
          };
        } else {
          return {
            status: "warn",
            message: `${version} (not configured)`,
            details: "Git user name and email not configured"
          };
        }
      } catch {
        return {
          status: "warn",
          message: `${version} (not configured)`,
          details: "Git user name and email not configured"
        };
      }
    } catch (error) {
      return {
        status: "fail",
        message: "Git not found",
        details: "Install Git from https://git-scm.com"
      };
    }
  }
  async checkTmux(autoFix) {
    try {
      const { stdout } = await execAsync6("tmux -V");
      const version = stdout.trim();
      return {
        status: "pass",
        message: `${version} (available)`,
        details: "tmux is installed and available for session management"
      };
    } catch (error) {
      if (autoFix) {
        try {
          const installed = await DependencyManager.installTmux();
          if (installed) {
            return {
              status: "pass",
              message: "Installed automatically",
              details: "tmux was successfully installed"
            };
          }
        } catch (installError) {
        }
      }
      return {
        status: "fail",
        message: "tmux not found",
        details: "tmux is required for session management"
      };
    }
  }
  async checkClaudeCode() {
    try {
      const { stdout } = await execAsync6("claude --version");
      const version = stdout.trim();
      return {
        status: "pass",
        message: `${version} (available)`,
        details: "Claude Code CLI is installed and available"
      };
    } catch (error) {
      if (process.env.CLAUDE_CODE) {
        return {
          status: "pass",
          message: "Running in Claude Code",
          details: "Tazz is running within Claude Code environment"
        };
      }
      return {
        status: "warn",
        message: "Claude Code not detected",
        details: "Some features may not be available without Claude Code integration"
      };
    }
  }
  async checkTazzConfig() {
    const tazzTmpDir = "/tmp/tazz-tmp";
    const configExists = await (0, import_fs_extra8.pathExists)(tazzTmpDir);
    if (configExists) {
      return {
        status: "pass",
        message: "Configuration directory exists",
        details: `Tazz data directory: ${tazzTmpDir}`
      };
    } else {
      return {
        status: "warn",
        message: "Configuration directory missing",
        details: "Will be created automatically when needed"
      };
    }
  }
  async checkSystemResources() {
    try {
      const { stdout } = await execAsync6("df -h /tmp");
      const lines = stdout.trim().split("\n");
      const tmpLine = lines[1];
      const parts = tmpLine.split(/\s+/);
      const available = parts[3];
      const usage = parts[4];
      const usagePercent = parseInt(usage.replace("%", ""));
      if (usagePercent < 80) {
        return {
          status: "pass",
          message: `Disk space: ${available} available`,
          details: `/tmp usage: ${usage}`
        };
      } else if (usagePercent < 90) {
        return {
          status: "warn",
          message: `Disk space: ${available} available`,
          details: `/tmp usage: ${usage} (consider cleaning up)`
        };
      } else {
        return {
          status: "fail",
          message: `Disk space: ${available} available`,
          details: `/tmp usage: ${usage} (critically low space)`
        };
      }
    } catch (error) {
      return {
        status: "warn",
        message: "Unable to check disk space",
        details: "System resource check failed"
      };
    }
  }
  async checkNetwork() {
    try {
      await execAsync6("ping -c 1 -W 5 8.8.8.8");
      try {
        await execAsync6("curl -s --max-time 10 https://registry.npmjs.org");
        return {
          status: "pass",
          message: "Internet connectivity available",
          details: "Can reach npm registry and external services"
        };
      } catch {
        return {
          status: "warn",
          message: "Limited connectivity",
          details: "Basic internet works but HTTPS may be restricted"
        };
      }
    } catch (error) {
      return {
        status: "warn",
        message: "No internet connectivity",
        details: "Some features may not work without internet access"
      };
    }
  }
  printHealthSummary(results) {
    const passed = results.filter((r) => r.status === "pass").length;
    const warnings = results.filter((r) => r.status === "warn").length;
    const failed = results.filter((r) => r.status === "fail").length;
    console.log(import_chalk10.default.bold("\u{1F4CA} Health Summary:"));
    console.log(import_chalk10.default.green(`   \u2705 Passed: ${passed}`));
    if (warnings > 0) {
      console.log(import_chalk10.default.yellow(`   \u26A0\uFE0F  Warnings: ${warnings}`));
    }
    if (failed > 0) {
      console.log(import_chalk10.default.red(`   \u274C Failed: ${failed}`));
    }
    if (failed === 0 && warnings === 0) {
      console.log("");
      console.log(import_chalk10.default.green.bold("\u{1F389} All systems healthy! Tazz CLI is ready to use."));
    } else if (failed === 0) {
      console.log("");
      console.log(import_chalk10.default.yellow.bold("\u26A0\uFE0F  Minor issues detected but Tazz CLI should work fine."));
    } else {
      console.log("");
      console.log(import_chalk10.default.red.bold("\u274C Critical issues detected. Some features may not work."));
    }
  }
  getRecommendation(checkName, status) {
    const recommendations = {
      "Node.js": {
        fail: "Install Node.js 18+ from https://nodejs.org",
        warn: "Upgrade to Node.js 18+ for better performance and latest features"
      },
      "npm/yarn": {
        fail: "Install Node.js (includes npm) or yarn package manager",
        warn: "Consider installing yarn for better package management"
      },
      "Git": {
        fail: 'Install Git from https://git-scm.com and configure with: git config --global user.name "Your Name" && git config --global user.email "your@email.com"',
        warn: 'Configure Git with: git config --global user.name "Your Name" && git config --global user.email "your@email.com"'
      },
      "tmux": {
        fail: "Install tmux using your package manager or run: tazz health --fix",
        warn: "Update tmux to latest version"
      },
      "Claude Code": {
        fail: "Install Claude Code from https://claude.ai/code",
        warn: "Some MCP features may not be available"
      },
      "System Resources": {
        fail: "Free up disk space in /tmp directory",
        warn: "Consider cleaning up temporary files"
      },
      "Network Connectivity": {
        fail: "Check internet connection and firewall settings",
        warn: "Some online features may not work"
      }
    };
    return recommendations[checkName]?.[status] || null;
  }
  async autoFix(failedChecks) {
    for (const check of failedChecks) {
      if (check.name === "tmux") {
        const spinner = (0, import_ora4.default)("Installing tmux").start();
        try {
          const installed = await DependencyManager.installTmux();
          if (installed) {
            spinner.succeed("tmux installed successfully");
            const stillMissing = await this.checkTmux(false);
            if (stillMissing.status === "pass") {
              console.log(import_chalk10.default.green("\u2705 tmux is now available and working"));
            }
          } else {
            spinner.fail("Failed to install tmux automatically");
            console.log(import_chalk10.default.yellow("\u{1F4A1} Try running: tazz health --fix"));
          }
        } catch (error) {
          spinner.fail("tmux installation failed");
          this.logger.error("Auto-fix failed for tmux", error);
        }
      }
      if (check.name === "Git" && check.message.includes("not configured")) {
        console.log("");
        console.log(import_chalk10.default.yellow("\u{1F527} Git configuration needed:"));
        console.log(import_chalk10.default.gray("   Run these commands to configure Git:"));
        console.log(import_chalk10.default.cyan('   git config --global user.name "Your Name"'));
        console.log(import_chalk10.default.cyan('   git config --global user.email "your@email.com"'));
      }
    }
  }
};

// src/cli/commands/interactive.ts
var import_commander9 = require("commander");
var import_chalk11 = __toESM(require("chalk"));
var import_inquirer2 = __toESM(require("inquirer"));

// src/cli/commands/attach.ts
var AttachCommand = class extends JoinCommand {
};

// src/cli/commands/interactive.ts
var InteractiveCommand = class {
  logger = getLogger();
  build() {
    return new import_commander9.Command("interactive").description("\u{1F300} Interactive Tazz CLI tool menu").alias("i").action(async () => {
      await this.execute();
    });
  }
  async execute() {
    console.clear();
    this.showLogo();
    while (true) {
      try {
        const choice = await this.showMainMenu();
        if (choice === "exit") {
          console.log("");
          console.log(import_chalk11.default.cyan("\u{1F44B} Thanks for using Tazz CLI Tool!"));
          console.log("");
          process.exit(0);
        }
        await this.handleMenuChoice(choice);
        console.log("");
        await import_inquirer2.default.prompt([{
          type: "input",
          name: "continue",
          message: "Press Enter to continue..."
        }]);
      } catch (error) {
        if (error === "SIGINT") {
          console.log("");
          console.log(import_chalk11.default.cyan("\u{1F44B} Goodbye!"));
          process.exit(0);
        }
        this.logger.error("Interactive menu error", error);
        console.log("");
        console.log(import_chalk11.default.red("\u274C An error occurred. Please try again."));
        console.log("");
      }
    }
  }
  showLogo() {
    const logo = `
        .       *        .        *
        .             .    *         .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .          *          .       *       .      .
     *          .             *        .      *
    `;
    console.log(import_chalk11.default.cyan(logo));
    console.log(import_chalk11.default.bold.cyan("=== Tazz CLI Tool ==="));
    console.log(import_chalk11.default.gray("   AI-Powered Development Orchestrator"));
    console.log("");
  }
  async showMainMenu() {
    const choices = [
      {
        name: `${import_chalk11.default.cyan("\u{1F3D7}\uFE0F  make")} - Setup Tazz in current project`,
        value: "make",
        short: "make"
      },
      {
        name: `${import_chalk11.default.cyan("\u{1F4DD} note")} - Edit tasks and prompts`,
        value: "note",
        short: "note"
      },
      {
        name: `${import_chalk11.default.cyan("\u{1F680} run")} - Start development session`,
        value: "run",
        short: "run"
      },
      new import_inquirer2.default.Separator(),
      {
        name: `${import_chalk11.default.yellow("\u{1F4CB} list")} - Show all sessions`,
        value: "list",
        short: "list"
      },
      {
        name: `${import_chalk11.default.yellow("\u{1F517} join")} - Attach to session`,
        value: "join",
        short: "join"
      },
      {
        name: `${import_chalk11.default.yellow("\u23F8\uFE0F  stop")} - Stop session`,
        value: "stop",
        short: "stop"
      },
      {
        name: `${import_chalk11.default.red("\u{1F5D1}\uFE0F  destroy")} - Delete session`,
        value: "destroy",
        short: "destroy"
      },
      new import_inquirer2.default.Separator(),
      {
        name: `${import_chalk11.default.blue("\u{1F3E5} health")} - System health check`,
        value: "health",
        short: "health"
      },
      {
        name: `${import_chalk11.default.blue("\u{1F9F9} clean")} - Clean cache and temp files`,
        value: "clean",
        short: "clean"
      },
      new import_inquirer2.default.Separator(),
      {
        name: `${import_chalk11.default.gray("\u274C exit")} - Exit Tazz CLI`,
        value: "exit",
        short: "exit"
      }
    ];
    const { action } = await import_inquirer2.default.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices,
        pageSize: 15
      }
    ]);
    return action;
  }
  async handleMenuChoice(choice) {
    console.log("");
    switch (choice) {
      case "make":
        await this.handleMake();
        break;
      case "note":
        await this.handleNote();
        break;
      case "run":
        await this.handleRun();
        break;
      case "list":
        await this.handleList();
        break;
      case "join":
        await this.handleJoin();
        break;
      case "stop":
        await this.handleStop();
        break;
      case "destroy":
        await this.handleDestroy();
        break;
      case "health":
        await this.handleHealth();
        break;
      case "clean":
        await this.handleClean();
        break;
      default:
        console.log(import_chalk11.default.red("Unknown action"));
    }
  }
  async handleMake() {
    const makeCommand = new MakeCommand();
    await makeCommand.execute();
  }
  async handleNote() {
    const { editor, template } = await import_inquirer2.default.prompt([
      {
        type: "list",
        name: "editor",
        message: "Choose editor:",
        choices: [
          { name: "VS Code", value: "code" },
          { name: "Vim", value: "vim" },
          { name: "Nano", value: "nano" },
          { name: "Emacs", value: "emacs" }
        ],
        default: "code"
      },
      {
        type: "list",
        name: "template",
        message: "Choose template:",
        choices: [
          { name: "Task List", value: "task" },
          { name: "Prompt Template", value: "prompt" },
          { name: "Session Plan", value: "session" }
        ],
        default: "task"
      }
    ]);
    const noteCommand = new NoteCommand();
    await noteCommand.execute({ editor, template });
  }
  async handleRun() {
    const { sessionName, tasks, branch, tmux } = await import_inquirer2.default.prompt([
      {
        type: "input",
        name: "sessionName",
        message: "Session name:",
        validate: (input) => {
          if (!input.trim()) {
            return "Session name is required";
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return "Session name can only contain letters, numbers, hyphens, and underscores";
          }
          return true;
        }
      },
      {
        type: "input",
        name: "tasks",
        message: "Tasks (comma-separated, optional):"
      },
      {
        type: "input",
        name: "branch",
        message: "Custom branch name (optional):"
      },
      {
        type: "confirm",
        name: "tmux",
        message: "Create tmux session?",
        default: true
      }
    ]);
    const runCommand = new RunCommand();
    await runCommand.execute(sessionName, {
      tasks: tasks || void 0,
      branch: branch || void 0,
      tmux
    });
  }
  async handleList() {
    const listCommand = new ListCommand();
    await listCommand.execute();
  }
  async handleJoin() {
    const listCommand = new ListCommand();
    await listCommand.execute();
    console.log("");
    const { sessionId } = await import_inquirer2.default.prompt([
      {
        type: "input",
        name: "sessionId",
        message: "Enter session ID to join:",
        validate: (input) => {
          if (!input.trim()) {
            return "Session ID is required";
          }
          return true;
        }
      }
    ]);
    const attachCommand = new AttachCommand();
    await attachCommand.execute(sessionId);
  }
  async handleStop() {
    const listCommand = new ListCommand();
    await listCommand.execute();
    console.log("");
    const { sessionId } = await import_inquirer2.default.prompt([
      {
        type: "input",
        name: "sessionId",
        message: "Enter session ID to stop:",
        validate: (input) => {
          if (!input.trim()) {
            return "Session ID is required";
          }
          return true;
        }
      }
    ]);
    const stopCommand = new StopCommand();
    await stopCommand.execute(sessionId);
  }
  async handleDestroy() {
    const { confirmAll } = await import_inquirer2.default.prompt([
      {
        type: "confirm",
        name: "confirmAll",
        message: import_chalk11.default.red("\u26A0\uFE0F  This will destroy ALL active sessions. Are you sure?"),
        default: false
      }
    ]);
    if (!confirmAll) {
      console.log(import_chalk11.default.gray("Operation cancelled."));
      return;
    }
    const { finalConfirm } = await import_inquirer2.default.prompt([
      {
        type: "input",
        name: "finalConfirm",
        message: import_chalk11.default.red('Type "destroy" to confirm:'),
        validate: (input) => {
          if (input !== "destroy") {
            return 'You must type "destroy" to confirm';
          }
          return true;
        }
      }
    ]);
    if (finalConfirm === "destroy") {
      console.log("");
      console.log(import_chalk11.default.yellow("\u{1F5D1}\uFE0F  Destroying all sessions..."));
      console.log(import_chalk11.default.green("\u2705 All sessions destroyed"));
    }
  }
  async handleHealth() {
    const { fix, verbose } = await import_inquirer2.default.prompt([
      {
        type: "confirm",
        name: "fix",
        message: "Automatically fix issues where possible?",
        default: true
      },
      {
        type: "confirm",
        name: "verbose",
        message: "Show detailed diagnostic information?",
        default: false
      }
    ]);
    const healthCommand = new HealthCommand();
    await healthCommand.execute({ fix, verbose });
  }
  async handleClean() {
    const { confirmClean } = await import_inquirer2.default.prompt([
      {
        type: "confirm",
        name: "confirmClean",
        message: "Clean cache and temporary files?",
        default: true
      }
    ]);
    if (confirmClean) {
      console.log("");
      console.log(import_chalk11.default.yellow("\u{1F9F9} Cleaning cache and temporary files..."));
      console.log(import_chalk11.default.green("\u2705 Clean completed"));
    } else {
      console.log(import_chalk11.default.gray("Clean cancelled."));
    }
  }
};

// src/cli/commands/clean.ts
var import_commander10 = require("commander");
var import_chalk12 = __toESM(require("chalk"));
var import_ora5 = __toESM(require("ora"));
var import_fs_extra9 = require("fs-extra");
var import_path9 = require("path");
var import_child_process8 = require("child_process");
var import_util10 = require("util");
var execAsync7 = (0, import_util10.promisify)(import_child_process8.exec);
var CleanCommand = class {
  logger = getLogger();
  build() {
    return new import_commander10.Command("clean").description("\u{1F9F9} Clean cache and temporary files").option("--deep", "Deep clean including logs and configuration").option("--dry-run", "Show what would be cleaned without actually cleaning").action(async (options) => {
      await this.execute(options);
    });
  }
  async execute(options = {}) {
    console.log("");
    console.log(import_chalk12.default.bold.cyan("\u{1F9F9} Tazz CLI Cleanup"));
    console.log(import_chalk12.default.gray("Cleaning cache and temporary files..."));
    console.log("");
    if (options.dryRun) {
      console.log(import_chalk12.default.yellow("\u{1F50D} DRY RUN - showing what would be cleaned"));
      console.log("");
    }
    const cleanupTasks = [
      {
        name: "Temporary worktrees",
        action: () => this.cleanTempWorktrees(options.dryRun)
      },
      {
        name: "Orphaned tmux sessions",
        action: () => this.cleanOrphanedTmuxSessions(options.dryRun)
      },
      {
        name: "Old session data",
        action: () => this.cleanOldSessionData(options.dryRun)
      },
      {
        name: "Cache files",
        action: () => this.cleanCacheFiles(options.dryRun)
      }
    ];
    if (options.deep) {
      cleanupTasks.push(
        {
          name: "Log files",
          action: () => this.cleanLogFiles(options.dryRun)
        },
        {
          name: "Configuration backup",
          action: () => this.cleanConfigBackups(options.dryRun)
        }
      );
    }
    let totalCleaned = 0;
    let totalSize = 0;
    for (const task of cleanupTasks) {
      const spinner = (0, import_ora5.default)(`Cleaning ${task.name}`).start();
      try {
        const result = await task.action();
        totalCleaned += result.count;
        totalSize += result.size;
        if (result.count > 0) {
          const sizeStr = this.formatSize(result.size);
          spinner.succeed(`${task.name}: ${result.count} items (${sizeStr})`);
        } else {
          spinner.succeed(`${task.name}: already clean`);
        }
      } catch (error) {
        spinner.fail(`${task.name}: ${error.message}`);
        this.logger.error("Cleanup task failed", error, { task: task.name });
      }
    }
    console.log("");
    console.log(import_chalk12.default.bold("\u{1F9F9} Cleanup Summary:"));
    console.log(import_chalk12.default.green(`   Items cleaned: ${totalCleaned}`));
    console.log(import_chalk12.default.green(`   Space freed: ${this.formatSize(totalSize)}`));
    if (options.dryRun) {
      console.log("");
      console.log(import_chalk12.default.yellow("Run without --dry-run to actually perform the cleanup"));
    } else if (totalCleaned > 0) {
      console.log("");
      console.log(import_chalk12.default.green("\u2705 Cleanup completed successfully!"));
    }
    console.log("");
  }
  async cleanTempWorktrees(dryRun) {
    const tazzDir = getTazzDir();
    const tempDir = (0, import_path9.join)(tazzDir, "temp");
    if (!await (0, import_fs_extra9.pathExists)(tempDir)) {
      return { count: 0, size: 0 };
    }
    const items = await (0, import_fs_extra9.readdir)(tempDir);
    let count = 0;
    let size = 0;
    for (const item of items) {
      const itemPath = (0, import_path9.join)(tempDir, item);
      try {
        const stats = await (0, import_fs_extra9.stat)(itemPath);
        size += stats.size;
        if (!dryRun) {
          await (0, import_fs_extra9.remove)(itemPath);
        }
        count++;
      } catch (error) {
        this.logger.debug("Failed to clean temp item", error, { item: itemPath });
      }
    }
    return { count, size };
  }
  async cleanOrphanedTmuxSessions(dryRun) {
    try {
      const { stdout } = await execAsync7('tmux list-sessions -F "#{session_name}" 2>/dev/null || true');
      const sessions = stdout.trim().split("\n").filter((s) => s.startsWith("tazz_"));
      const orphanedSessions = sessions.filter((s) => s.includes("orphaned"));
      let count = 0;
      for (const session of orphanedSessions) {
        if (!dryRun) {
          try {
            await execAsync7(`tmux kill-session -t ${session}`);
            count++;
          } catch (error) {
          }
        } else {
          count++;
        }
      }
      return { count, size: count * 1024 };
    } catch (error) {
      return { count: 0, size: 0 };
    }
  }
  async cleanOldSessionData(dryRun) {
    const tazzDir = getTazzDir();
    const projectsDir = (0, import_path9.join)(tazzDir, "projects");
    if (!await (0, import_fs_extra9.pathExists)(projectsDir)) {
      return { count: 0, size: 0 };
    }
    const projects = await (0, import_fs_extra9.readdir)(projectsDir);
    let count = 0;
    let size = 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
    for (const project of projects) {
      const projectPath = (0, import_path9.join)(projectsDir, project);
      const sessionsFile = (0, import_path9.join)(projectPath, "sessions.json");
      if (await (0, import_fs_extra9.pathExists)(sessionsFile)) {
        try {
          const stats = await (0, import_fs_extra9.stat)(sessionsFile);
          if (stats.mtime.getTime() < oneWeekAgo) {
            size += stats.size;
            if (!dryRun) {
              await (0, import_fs_extra9.remove)(projectPath);
            }
            count++;
          }
        } catch (error) {
          this.logger.debug("Failed to check session data", error, { project });
        }
      }
    }
    return { count, size };
  }
  async cleanCacheFiles(dryRun) {
    const tazzDir = getTazzDir();
    const cacheDir = (0, import_path9.join)(tazzDir, "cache");
    if (!await (0, import_fs_extra9.pathExists)(cacheDir)) {
      return { count: 0, size: 0 };
    }
    const items = await (0, import_fs_extra9.readdir)(cacheDir);
    let count = 0;
    let size = 0;
    for (const item of items) {
      const itemPath = (0, import_path9.join)(cacheDir, item);
      try {
        const stats = await (0, import_fs_extra9.stat)(itemPath);
        size += stats.size;
        if (!dryRun) {
          await (0, import_fs_extra9.remove)(itemPath);
        }
        count++;
      } catch (error) {
        this.logger.debug("Failed to clean cache item", error, { item: itemPath });
      }
    }
    return { count, size };
  }
  async cleanLogFiles(dryRun) {
    const tazzDir = getTazzDir();
    const logsDir = (0, import_path9.join)(tazzDir, "logs");
    if (!await (0, import_fs_extra9.pathExists)(logsDir)) {
      return { count: 0, size: 0 };
    }
    const logFiles = await (0, import_fs_extra9.readdir)(logsDir);
    let count = 0;
    let size = 0;
    const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1e3;
    for (const logFile of logFiles) {
      const logPath = (0, import_path9.join)(logsDir, logFile);
      try {
        const stats = await (0, import_fs_extra9.stat)(logPath);
        if (stats.mtime.getTime() < oneMonthAgo) {
          size += stats.size;
          if (!dryRun) {
            await (0, import_fs_extra9.remove)(logPath);
          }
          count++;
        }
      } catch (error) {
        this.logger.debug("Failed to clean log file", error, { logFile });
      }
    }
    return { count, size };
  }
  async cleanConfigBackups(dryRun) {
    const tazzDir = getTazzDir();
    const backupDir = (0, import_path9.join)(tazzDir, "backups");
    if (!await (0, import_fs_extra9.pathExists)(backupDir)) {
      return { count: 0, size: 0 };
    }
    const backupFiles = await (0, import_fs_extra9.readdir)(backupDir);
    let count = 0;
    let size = 0;
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1e3;
    for (const backupFile of backupFiles) {
      const backupPath = (0, import_path9.join)(backupDir, backupFile);
      try {
        const stats = await (0, import_fs_extra9.stat)(backupPath);
        if (stats.mtime.getTime() < twoWeeksAgo) {
          size += stats.size;
          if (!dryRun) {
            await (0, import_fs_extra9.remove)(backupPath);
          }
          count++;
        }
      } catch (error) {
        this.logger.debug("Failed to clean backup file", error, { backupFile });
      }
    }
    return { count, size };
  }
  formatSize(bytes) {
    if (bytes === 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
};

// src/index.ts
var logger2 = getLogger();
var TAZZ_LOGO = `
        .       *        .        *
        .             .    *         .       .
                   @@@
                @@@@@@@
              @@@@#^#@@@@
                @@@@@@@
                  @@@
                   @@
        ___@______________________
 .          *          .       *       .      .
     *          .             *        .      *
`;
async function main() {
  const program = new import_commander11.Command();
  program.name("tazz").description("\u{1F300} AI-powered development tool with git worktrees, tmux sessions, and MCP integration").version("1.0.0").configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => cmd.name() + " " + cmd.usage()
  });
  program.option("-v, --verbose", "Enable verbose logging").option("-q, --quiet", "Suppress non-error output").option("--log-level <level>", "Set log level (debug, info, warn, error)", "info");
  program.hook("preAction", (thisCommand) => {
    const options = thisCommand.opts();
    if (options.verbose) {
      logger2.setLevel("debug");
    } else if (options.quiet) {
      logger2.setLevel("error");
    } else if (options.logLevel) {
      logger2.setLevel(options.logLevel);
    }
  });
  program.addCommand(new MakeCommand().build());
  program.addCommand(new NoteCommand().build());
  program.addCommand(new RunCommand().build());
  program.addCommand(new ListCommand().build());
  program.addCommand(new JoinCommand().build());
  program.addCommand(new StopCommand().build());
  program.addCommand(new DeleteCommand().build());
  program.addCommand(new HealthCommand().build());
  program.addCommand(new CleanCommand().build());
  program.command("interactive", { isDefault: false }).alias("i").description("\u{1F300} Interactive Tazz CLI tool menu").action(async () => {
    const interactiveCmd = new InteractiveCommand();
    await interactiveCmd.execute();
  });
  program.on("--help", () => {
    console.log("");
    console.log(import_chalk13.default.cyan("Examples:"));
    console.log("  $ tazz                         Start interactive menu");
    console.log("  $ tazz make                    Setup Tazz in current project");
    console.log("  $ tazz note                    Edit tasks and prompts");
    console.log("  $ tazz run feature-auth        Start development instance");
    console.log("  $ tazz health                  Check system dependencies");
    console.log("  $ tazz list                    Show all instances");
    console.log("");
    console.log(import_chalk13.default.yellow("For more information, visit: https://github.com/tazz-dev/tazz-cli"));
  });
  program.exitOverride();
  if (process.argv.length === 2) {
    const interactiveCmd = new InteractiveCommand();
    await interactiveCmd.execute();
    return;
  }
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error.code === "commander.unknownCommand") {
      console.log("");
      console.log(import_chalk13.default.red("\u274C Unknown command. Use --help to see available commands."));
      console.log("");
      process.exit(1);
    }
    if (error.code === "commander.help" || error.message === "(outputHelp)") {
      process.exit(0);
    }
    logger2.error("Unexpected error occurred", error);
    console.log("");
    console.log(import_chalk13.default.red("\u274C An unexpected error occurred. Check logs for details."));
    console.log(import_chalk13.default.gray(`   Log file: /tmp/tazz-tmp/logs/tazz.log`));
    process.exit(1);
  }
}
process.on("unhandledRejection", (reason, promise) => {
  logger2.error("Unhandled Promise Rejection", reason, {
    promise: promise.toString()
  });
  console.log("");
  console.log(import_chalk13.default.red("\u274C An unexpected error occurred. Check logs for details."));
  process.exit(1);
});
process.on("uncaughtException", (error) => {
  logger2.error("Uncaught Exception", error);
  console.log("");
  console.log(import_chalk13.default.red("\u274C A critical error occurred. Check logs for details."));
  process.exit(1);
});
if (require.main === module) {
  console.log(import_chalk13.default.cyan(TAZZ_LOGO));
  console.log(import_chalk13.default.bold.cyan("=== Tazz CLI Tool ==="));
  console.log(import_chalk13.default.gray("   AI-Powered Development Orchestrator"));
  console.log("");
}
if (require.main === module) {
  main().catch((error) => {
    logger2.error("Main execution failed", error);
    process.exit(1);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentCommandType,
  AgentError,
  AgentStatus,
  AgentType,
  CodebaseAnalysisError,
  CodebaseAnalyzer,
  GitError,
  IntelligentRulesGenerator,
  MCPError,
  MCPIntegrationService,
  ProjectType,
  RulesGenerationError,
  SessionError,
  SessionStatus,
  TaskStatus,
  TazzError,
  ValidationError,
  main
});
//# sourceMappingURL=index.js.map
