
// argon2-asm.min.js
var Module;
if (!Module) Module = (typeof Module !== "undefined" ? Module : null) || {};
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key]
  }
}
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
if (Module["ENVIRONMENT"]) {
  if (Module["ENVIRONMENT"] === "WEB") {
    ENVIRONMENT_IS_WEB = true
  } else if (Module["ENVIRONMENT"] === "WORKER") {
    ENVIRONMENT_IS_WORKER = true
  } else if (Module["ENVIRONMENT"] === "NODE") {
    ENVIRONMENT_IS_NODE = true
  } else if (Module["ENVIRONMENT"] === "SHELL") {
    ENVIRONMENT_IS_SHELL = true
  } else {
    throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")
  }
} else {
  ENVIRONMENT_IS_WEB = typeof window === "object";
  ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
  ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER
}
if (ENVIRONMENT_IS_NODE) {
  throw new Error('Node is not supported')
} else if (ENVIRONMENT_IS_SHELL) {
  if (!Module["print"]) Module["print"] = print;
  if (typeof printErr != "undefined") Module["printErr"] = printErr;
  if (typeof read != "undefined") {
    Module["read"] = read
  } else {
    Module["read"] = function shell_read() {
      throw "no read() available"
    }
  }
  Module["readBinary"] = function readBinary(f) {
    if (typeof readbuffer === "function") {
      return new Uint8Array(readbuffer(f))
    }
    var data = read(f, "binary");
    assert(typeof data === "object");
    return data
  };
  if (typeof scriptArgs != "undefined") {
    Module["arguments"] = scriptArgs
  } else if (typeof arguments != "undefined") {
    Module["arguments"] = arguments
  }
  if (typeof quit === "function") {
    Module["quit"] = (function (status, toThrow) {
      quit(status)
    })
  }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module["read"] = function shell_read(url) {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText
  };
  if (ENVIRONMENT_IS_WORKER) {
    Module["readBinary"] = function readBinary(url) {
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, false);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
      return new Uint8Array(xhr.response)
    }
  }
  Module["readAsync"] = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
        onload(xhr.response)
      } else {
        onerror()
      }
    };
    xhr.onerror = onerror;
    xhr.send(null)
  };
  if (typeof arguments != "undefined") {
    Module["arguments"] = arguments
  }
  if (typeof console !== "undefined") {
    if (!Module["print"]) Module["print"] = function shell_print(x) {
      console.log(x)
    };
    if (!Module["printErr"]) Module["printErr"] = function shell_printErr(x) {
      console.warn(x)
    }
  } else {
    var TRY_USE_DUMP = false;
    if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function (x) {
      dump(x)
    }) : (function (x) { })
  }
  if (ENVIRONMENT_IS_WORKER) {
    Module["load"] = importScripts
  }
  if (typeof Module["setWindowTitle"] === "undefined") {
    Module["setWindowTitle"] = (function (title) {
      document.title = title
    })
  }
} else {
  throw "Unknown runtime environment. Where are we?"
}

function globalEval(x) {
  eval.call(null, x)
}
if (!Module["load"] && Module["read"]) {
  Module["load"] = function load(f) {
    globalEval(Module["read"](f))
  }
}
if (!Module["print"]) {
  Module["print"] = (function () { })
}
if (!Module["printErr"]) {
  Module["printErr"] = Module["print"]
}
if (!Module["arguments"]) {
  Module["arguments"] = []
}
if (!Module["thisProgram"]) {
  Module["thisProgram"] = "./this.program"
}
if (!Module["quit"]) {
  Module["quit"] = (function (status, toThrow) {
    throw toThrow
  })
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key]
  }
}
moduleOverrides = undefined;
var Runtime = {
  setTempRet0: (function (value) {
    tempRet0 = value;
    return value
  }),
  getTempRet0: (function () {
    return tempRet0
  }),
  stackSave: (function () {
    return STACKTOP
  }),
  stackRestore: (function (stackTop) {
    STACKTOP = stackTop
  }),
  getNativeTypeSize: (function (type) {
    switch (type) {
      case "i1":
      case "i8":
        return 1;
      case "i16":
        return 2;
      case "i32":
        return 4;
      case "i64":
        return 8;
      case "float":
        return 4;
      case "double":
        return 8;
      default:
        {
          if (type[type.length - 1] === "*") {
            return Runtime.QUANTUM_SIZE
          } else if (type[0] === "i") {
            var bits = parseInt(type.substr(1));
            assert(bits % 8 === 0);
            return bits / 8
          } else {
            return 0
          }
        }
    }
  }),
  getNativeFieldSize: (function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE)
  }),
  STACK_ALIGN: 16,
  prepVararg: (function (ptr, type) {
    if (type === "double" || type === "i64") {
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4
      }
    } else {
      assert((ptr & 3) === 0)
    }
    return ptr
  }),
  getAlignSize: (function (type, size, vararg) {
    if (!vararg && (type == "i64" || type == "double")) return 8;
    if (!type) return Math.min(size, 8);
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE)
  }),
  dynCall: (function (sig, ptr, args) {
    if (args && args.length) {
      return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
    } else {
      return Module["dynCall_" + sig].call(null, ptr)
    }
  }),
  functionPointers: [],
  addFunction: (function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 * (1 + i)
      }
    }
    throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."
  }),
  removeFunction: (function (index) {
    Runtime.functionPointers[(index - 2) / 2] = null
  }),
  warnOnce: (function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text)
    }
  }),
  funcWrappers: {},
  getFuncWrapper: (function (func, sig) {
    if (!func) return;
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {}
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      if (sig.length === 1) {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func)
        }
      } else if (sig.length === 2) {
        sigCache[func] = function dynCall_wrapper(arg) {
          return Runtime.dynCall(sig, func, [arg])
        }
      } else {
        sigCache[func] = function dynCall_wrapper() {
          return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments))
        }
      }
    }
    return sigCache[func]
  }),
  getCompilerSetting: (function (name) {
    throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"
  }),
  stackAlloc: (function (size) {
    var ret = STACKTOP;
    STACKTOP = STACKTOP + size | 0;
    STACKTOP = STACKTOP + 15 & -16;
    return ret
  }),
  staticAlloc: (function (size) {
    var ret = STATICTOP;
    STATICTOP = STATICTOP + size | 0;
    STATICTOP = STATICTOP + 15 & -16;
    return ret
  }),
  dynamicAlloc: (function (size) {
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];
    var end = (ret + size + 15 | 0) & -16;
    HEAP32[DYNAMICTOP_PTR >> 2] = end;
    if (end >= TOTAL_MEMORY) {
      var success = enlargeMemory();
      if (!success) {
        HEAP32[DYNAMICTOP_PTR >> 2] = ret;
        return 0
      }
    }
    return ret
  }),
  alignMemory: (function (size, quantum) {
    var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
    return ret
  }),
  makeBigInt: (function (low, high, unsigned) {
    var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
    return ret
  }),
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
};
Module["Runtime"] = Runtime;
var ABORT = 0;
var EXITSTATUS = 0;

function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed: " + text)
  }
}

function getCFunc(ident) {
  var func = Module["_" + ident];
  if (!func) {
    try {
      func = eval("_" + ident)
    } catch (e) { }
  }
  assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
  return func
}
var cwrap, ccall;
((function () {
  var JSfuncs = {
    "stackSave": (function () {
      Runtime.stackSave()
    }),
    "stackRestore": (function () {
      Runtime.stackRestore()
    }),
    "arrayToC": (function (arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret
    }),
    "stringToC": (function (str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) {
        var len = (str.length << 2) + 1;
        ret = Runtime.stackAlloc(len);
        stringToUTF8(str, ret, len)
      }
      return ret
    })
  };
  var toC = {
    "string": JSfuncs["stringToC"],
    "array": JSfuncs["arrayToC"]
  };
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i])
        } else {
          cArgs[i] = args[i]
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if (returnType === "string") ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push((function () {
          Runtime.stackRestore(stack)
        }));
        return
      }
      Runtime.stackRestore(stack)
    }
    return ret
  };
  var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;

  function parseJSFunc(jsfunc) {
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {
      arguments: parsed[0],
      body: parsed[1],
      returnValue: parsed[2]
    }
  }
  var JSsource = null;

  function ensureJSsource() {
    if (!JSsource) {
      JSsource = {};
      for (var fun in JSfuncs) {
        if (JSfuncs.hasOwnProperty(fun)) {
          JSsource[fun] = parseJSFunc(JSfuncs[fun])
        }
      }
    }
  }
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    var numericArgs = argTypes.every((function (type) {
      return type === "number"
    }));
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs) {
      return cfunc
    }
    var argNames = argTypes.map((function (x, i) {
      return "$" + i
    }));
    var funcstr = "(function(" + argNames.join(",") + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      ensureJSsource();
      funcstr += "var stack = " + JSsource["stackSave"].body + ";";
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i],
          type = argTypes[i];
        if (type === "number") continue;
        var convertCode = JSsource[type + "ToC"];
        funcstr += "var " + convertCode.arguments + " = " + arg + ";";
        funcstr += convertCode.body + ";";
        funcstr += arg + "=(" + convertCode.returnValue + ");"
      }
    }
    var cfuncname = parseJSFunc((function () {
      return cfunc
    })).returnValue;
    funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
    if (!numericRet) {
      var strgfy = parseJSFunc((function () {
        return Pointer_stringify
      })).returnValue;
      funcstr += "ret = " + strgfy + "(ret);"
    }
    if (!numericArgs) {
      ensureJSsource();
      funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";"
    }
    funcstr += "return ret})";
    return eval(funcstr)
  }
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";
  switch (type) {
    case "i1":
      HEAP8[ptr >> 0] = value;
      break;
    case "i8":
      HEAP8[ptr >> 0] = value;
      break;
    case "i16":
      HEAP16[ptr >> 1] = value;
      break;
    case "i32":
      HEAP32[ptr >> 2] = value;
      break;
    case "i64":
      tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
      break;
    case "float":
      HEAPF32[ptr >> 2] = value;
      break;
    case "double":
      HEAPF64[ptr >> 3] = value;
      break;
    default:
      abort("invalid type for setValue: " + type)
  }
}
Module["setValue"] = setValue;

function getValue(ptr, type, noSafe) {
  type = type || "i8";
  if (type.charAt(type.length - 1) === "*") type = "i32";
  switch (type) {
    case "i1":
      return HEAP8[ptr >> 0];
    case "i8":
      return HEAP8[ptr >> 0];
    case "i16":
      return HEAP16[ptr >> 1];
    case "i32":
      return HEAP32[ptr >> 2];
    case "i64":
      return HEAP32[ptr >> 2];
    case "float":
      return HEAPF32[ptr >> 2];
    case "double":
      return HEAPF64[ptr >> 3];
    default:
      abort("invalid type for setValue: " + type)
  }
  return null
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === "number") {
    zeroinit = true;
    size = slab
  } else {
    zeroinit = false;
    size = slab.length
  }
  var singleType = typeof types === "string" ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr
  } else {
    ret = [typeof _malloc === "function" ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length))
  }
  if (zeroinit) {
    var ptr = ret,
      stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[ptr >> 2] = 0
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[ptr++ >> 0] = 0
    }
    return ret
  }
  if (singleType === "i8") {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret)
    } else {
      HEAPU8.set(new Uint8Array(slab), ret)
    }
    return ret
  }
  var i = 0,
    type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === "function") {
      curr = Runtime.getFunctionIndex(curr)
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue
    }
    if (type == "i64") type = "i32";
    setValue(ret + i, curr, type);
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type
    }
    i += typeSize
  }
  return ret
}
Module["allocate"] = allocate;

function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size)
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, length) {
  if (length === 0 || !ptr) return "";
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[ptr + i >> 0];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break
  }
  if (!length) length = i;
  var ret = "";
  if (hasUtf < 128) {
    var MAX_CHUNK = 1024;
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK
    }
    return ret
  }
  return Module["UTF8ToString"](ptr)
}
Module["Pointer_stringify"] = Pointer_stringify;

function AsciiToString(ptr) {
  var str = "";
  while (1) {
    var ch = HEAP8[ptr++ >> 0];
    if (!ch) return str;
    str += String.fromCharCode(ch)
  }
}
Module["AsciiToString"] = AsciiToString;

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false)
}
Module["stringToAscii"] = stringToAscii;
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx) {
  var endPtr = idx;
  while (u8Array[endPtr])++endPtr;
  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
  } else {
    var u0, u1, u2, u3, u4, u5;
    var str = "";
    while (1) {
      u0 = u8Array[idx++];
      if (!u0) return str;
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue
      }
      u1 = u8Array[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue
      }
      u2 = u8Array[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2
      } else {
        u3 = u8Array[idx++] & 63;
        if ((u0 & 248) == 240) {
          u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3
        } else {
          u4 = u8Array[idx++] & 63;
          if ((u0 & 252) == 248) {
            u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4
          } else {
            u5 = u8Array[idx++] & 63;
            u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5
          }
        }
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0)
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
      }
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8, ptr)
}
Module["UTF8ToString"] = UTF8ToString;

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 192 | u >> 6;
      outU8Array[outIdx++] = 128 | u & 63
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 224 | u >> 12;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63
    } else if (u <= 2097151) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 240 | u >> 18;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63
    } else if (u <= 67108863) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 248 | u >> 24;
      outU8Array[outIdx++] = 128 | u >> 18 & 63;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 252 | u >> 30;
      outU8Array[outIdx++] = 128 | u >> 24 & 63;
      outU8Array[outIdx++] = 128 | u >> 18 & 63;
      outU8Array[outIdx++] = 128 | u >> 12 & 63;
      outU8Array[outIdx++] = 128 | u >> 6 & 63;
      outU8Array[outIdx++] = 128 | u & 63
    }
  }
  outU8Array[outIdx] = 0;
  return outIdx - startIdx
}
Module["stringToUTF8Array"] = stringToUTF8Array;

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
Module["stringToUTF8"] = stringToUTF8;

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
    if (u <= 127) {
      ++len
    } else if (u <= 2047) {
      len += 2
    } else if (u <= 65535) {
      len += 3
    } else if (u <= 2097151) {
      len += 4
    } else if (u <= 67108863) {
      len += 5
    } else {
      len += 6
    }
  }
  return len
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function demangle(func) {
  var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];
  if (__cxa_demangle_func) {
    try {
      var s = func.substr(1);
      var len = lengthBytesUTF8(s) + 1;
      var buf = _malloc(len);
      stringToUTF8(s, buf, len);
      var status = _malloc(4);
      var ret = __cxa_demangle_func(buf, 0, 0, status);
      if (getValue(status, "i32") === 0 && ret) {
        return Pointer_stringify(ret)
      }
    } catch (e) { } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret)
    }
    return func
  }
  Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
  return func
}

function demangleAll(text) {
  var regex = /__Z[\w\d_]+/g;
  return text.replace(regex, (function (x) {
    var y = demangle(x);
    return x === y ? x : x + " [" + y + "]"
  }))
}

function jsStackTrace() {
  var err = new Error;
  if (!err.stack) {
    try {
      throw new Error(0)
    } catch (e) {
      err = e
    }
    if (!err.stack) {
      return "(no stack trace available)"
    }
  }
  return err.stack.toString()
}

function stackTrace() {
  var js = jsStackTrace();
  if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
  return demangleAll(js)
}
Module["stackTrace"] = stackTrace;
var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferViews() {
  Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
  Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
  Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer)
}
var STATIC_BASE, STATICTOP, staticSealed;
var STACK_BASE, STACKTOP, STACK_MAX;
var DYNAMIC_BASE, DYNAMICTOP_PTR;
STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
staticSealed = false;

function abortOnCannotGrowMemory() {
  abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")
}

function enlargeMemory() {
  abortOnCannotGrowMemory()
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 134217728;
if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
if (Module["buffer"]) {
  buffer = Module["buffer"]
} else {
  {
    buffer = new ArrayBuffer(TOTAL_MEMORY)
  }
}
updateGlobalBufferViews();

function getTotalMemory() {
  return TOTAL_MEMORY
}
HEAP32[0] = 1668509029;
HEAP16[1] = 25459;
if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99) throw "Runtime error: expected the system to be little-endian!";
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while (callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == "function") {
      callback();
      continue
    }
    var func = callback.func;
    if (typeof func === "number") {
      if (callback.arg === undefined) {
        Module["dynCall_v"](func)
      } else {
        Module["dynCall_vi"](func, callback.arg)
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg)
    }
  }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift())
    }
  }
  callRuntimeCallbacks(__ATPRERUN__)
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true
}

function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift())
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb)
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb)
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb)
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb)
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb)
}
Module["addOnPostRun"] = addOnPostRun;

function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 255) {
      chr &= 255
    }
    ret.push(String.fromCharCode(chr))
  }
  return ret.join("")
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
  var lastChar, end;
  if (dontAddNull) {
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end]
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer)
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[buffer++ >> 0] = str.charCodeAt(i)
  }
  if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
  var ah = a >>> 16;
  var al = a & 65535;
  var bh = b >>> 16;
  var bl = b & 65535;
  return al * bl + (ah * bl + al * bh << 16) | 0
};
Math.imul = Math["imul"];
if (!Math["clz32"]) Math["clz32"] = (function (x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & 1 << 31 - i) return i
  }
  return 32
});
Math.clz32 = Math["clz32"];
if (!Math["trunc"]) Math["trunc"] = (function (x) {
  return x < 0 ? Math.ceil(x) : Math.floor(x)
});
Math.trunc = Math["trunc"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies)
  }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies)
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback()
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var ASM_CONSTS = [];
STATIC_BASE = Runtime.GLOBAL_BASE;
STATICTOP = STATIC_BASE + 2672;
__ATINIT__.push();
allocate([8, 201, 188, 243, 103, 230, 9, 106, 59, 167, 202, 132, 133, 174, 103, 187, 43, 248, 148, 254, 114, 243, 110, 60, 241, 54, 29, 95, 58, 245, 79, 165, 209, 130, 230, 173, 127, 82, 14, 81, 31, 108, 62, 43, 140, 104, 5, 155, 107, 189, 65, 251, 171, 217, 131, 31, 121, 33, 126, 19, 25, 205, 224, 91, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 14, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 15, 0, 0, 0, 13, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 11, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0, 11, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 2, 0, 0, 0, 15, 0, 0, 0, 13, 0, 0, 0, 10, 0, 0, 0, 14, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 9, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 9, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 13, 0, 0, 0, 12, 0, 0, 0, 11, 0, 0, 0, 14, 0, 0, 0, 2, 0, 0, 0, 6, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 15, 0, 0, 0, 14, 0, 0, 0, 1, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 6, 0, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 13, 0, 0, 0, 2, 0, 0, 0, 12, 0, 0, 0, 6, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 13, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0, 15, 0, 0, 0, 14, 0, 0, 0, 1, 0, 0, 0, 9, 0, 0, 0, 12, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 14, 0, 0, 0, 13, 0, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0, 9, 0, 0, 0, 2, 0, 0, 0, 8, 0, 0, 0, 11, 0, 0, 0, 13, 0, 0, 0, 11, 0, 0, 0, 7, 0, 0, 0, 14, 0, 0, 0, 12, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 9, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 6, 0, 0, 0, 2, 0, 0, 0, 10, 0, 0, 0, 6, 0, 0, 0, 15, 0, 0, 0, 14, 0, 0, 0, 9, 0, 0, 0, 11, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 2, 0, 0, 0, 13, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 2, 0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 7, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 15, 0, 0, 0, 11, 0, 0, 0, 9, 0, 0, 0, 14, 0, 0, 0, 3, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 14, 0, 0, 0, 10, 0, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 15, 0, 0, 0, 13, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 11, 0, 0, 0, 7, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 110, 107, 110, 111, 119, 110, 32, 101, 114, 114, 111, 114, 32, 99, 111, 100, 101, 0, 84, 104, 101, 32, 112, 97, 115, 115, 119, 111, 114, 100, 32, 100, 111, 101, 115, 32, 110, 111, 116, 32, 109, 97, 116, 99, 104, 32, 116, 104, 101, 32, 115, 117, 112, 112, 108, 105, 101, 100, 32, 104, 97, 115, 104, 0, 83, 111, 109, 101, 32, 111, 102, 32, 101, 110, 99, 111, 100, 101, 100, 32, 112, 97, 114, 97, 109, 101, 116, 101, 114, 115, 32, 97, 114, 101, 32, 116, 111, 111, 32, 108, 111, 110, 103, 32, 111, 114, 32, 116, 111, 111, 32, 115, 104, 111, 114, 116, 0, 84, 104, 114, 101, 97, 100, 105, 110, 103, 32, 102, 97, 105, 108, 117, 114, 101, 0, 68, 101, 99, 111, 100, 105, 110, 103, 32, 102, 97, 105, 108, 101, 100, 0, 69, 110, 99, 111, 100, 105, 110, 103, 32, 102, 97, 105, 108, 101, 100, 0, 77, 105, 115, 115, 105, 110, 103, 32, 97, 114, 103, 117, 109, 101, 110, 116, 115, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 116, 104, 114, 101, 97, 100, 115, 0, 78, 111, 116, 32, 101, 110, 111, 117, 103, 104, 32, 116, 104, 114, 101, 97, 100, 115, 0, 79, 117, 116, 112, 117, 116, 32, 112, 111, 105, 110, 116, 101, 114, 32, 109, 105, 115, 109, 97, 116, 99, 104, 0, 84, 104, 101, 114, 101, 32, 105, 115, 32, 110, 111, 32, 115, 117, 99, 104, 32, 118, 101, 114, 115, 105, 111, 110, 32, 111, 102, 32, 65, 114, 103, 111, 110, 50, 0, 65, 114, 103, 111, 110, 50, 95, 67, 111, 110, 116, 101, 120, 116, 32, 99, 111, 110, 116, 101, 120, 116, 32, 105, 115, 32, 78, 85, 76, 76, 0, 84, 104, 101, 32, 97, 108, 108, 111, 99, 97, 116, 101, 32, 109, 101, 109, 111, 114, 121, 32, 99, 97, 108, 108, 98, 97, 99, 107, 32, 105, 115, 32, 78, 85, 76, 76, 0, 84, 104, 101, 32, 102, 114, 101, 101, 32, 109, 101, 109, 111, 114, 121, 32, 99, 97, 108, 108, 98, 97, 99, 107, 32, 105, 115, 32, 78, 85, 76, 76, 0, 77, 101, 109, 111, 114, 121, 32, 97, 108, 108, 111, 99, 97, 116, 105, 111, 110, 32, 101, 114, 114, 111, 114, 0, 65, 115, 115, 111, 99, 105, 97, 116, 101, 100, 32, 100, 97, 116, 97, 32, 112, 111, 105, 110, 116, 101, 114, 32, 105, 115, 32, 78, 85, 76, 76, 44, 32, 98, 117, 116, 32, 97, 100, 32, 108, 101, 110, 103, 116, 104, 32, 105, 115, 32, 110, 111, 116, 32, 48, 0, 83, 101, 99, 114, 101, 116, 32, 112, 111, 105, 110, 116, 101, 114, 32, 105, 115, 32, 78, 85, 76, 76, 44, 32, 98, 117, 116, 32, 115, 101, 99, 114, 101, 116, 32, 108, 101, 110, 103, 116, 104, 32, 105, 115, 32, 110, 111, 116, 32, 48, 0, 83, 97, 108, 116, 32, 112, 111, 105, 110, 116, 101, 114, 32, 105, 115, 32, 78, 85, 76, 76, 44, 32, 98, 117, 116, 32, 115, 97, 108, 116, 32, 108, 101, 110, 103, 116, 104, 32, 105, 115, 32, 110, 111, 116, 32, 48, 0, 80, 97, 115, 115, 119, 111, 114, 100, 32, 112, 111, 105, 110, 116, 101, 114, 32, 105, 115, 32, 78, 85, 76, 76, 44, 32, 98, 117, 116, 32, 112, 97, 115, 115, 119, 111, 114, 100, 32, 108, 101, 110, 103, 116, 104, 32, 105, 115, 32, 110, 111, 116, 32, 48, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 108, 97, 110, 101, 115, 0, 84, 111, 111, 32, 102, 101, 119, 32, 108, 97, 110, 101, 115, 0, 77, 101, 109, 111, 114, 121, 32, 99, 111, 115, 116, 32, 105, 115, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 77, 101, 109, 111, 114, 121, 32, 99, 111, 115, 116, 32, 105, 115, 32, 116, 111, 111, 32, 115, 109, 97, 108, 108, 0, 84, 105, 109, 101, 32, 99, 111, 115, 116, 32, 105, 115, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 84, 105, 109, 101, 32, 99, 111, 115, 116, 32, 105, 115, 32, 116, 111, 111, 32, 115, 109, 97, 108, 108, 0, 83, 101, 99, 114, 101, 116, 32, 105, 115, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 83, 101, 99, 114, 101, 116, 32, 105, 115, 32, 116, 111, 111, 32, 115, 104, 111, 114, 116, 0, 65, 115, 115, 111, 99, 105, 97, 116, 101, 100, 32, 100, 97, 116, 97, 32, 105, 115, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 65, 115, 115, 111, 99, 105, 97, 116, 101, 100, 32, 100, 97, 116, 97, 32, 105, 115, 32, 116, 111, 111, 32, 115, 104, 111, 114, 116, 0, 83, 97, 108, 116, 32, 105, 115, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 83, 97, 108, 116, 32, 105, 115, 32, 116, 111, 111, 32, 115, 104, 111, 114, 116, 0, 80, 97, 115, 115, 119, 111, 114, 100, 32, 105, 115, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 80, 97, 115, 115, 119, 111, 114, 100, 32, 105, 115, 32, 116, 111, 111, 32, 115, 104, 111, 114, 116, 0, 79, 117, 116, 112, 117, 116, 32, 105, 115, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 79, 117, 116, 112, 117, 116, 32, 105, 115, 32, 116, 111, 111, 32, 115, 104, 111, 114, 116, 0, 79, 117, 116, 112, 117, 116, 32, 112, 111, 105, 110, 116, 101, 114, 32, 105, 115, 32, 78, 85, 76, 76, 0, 79, 75, 0, 44, 100, 97, 116, 97, 61, 0, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 0, 36, 97, 114, 103, 111, 110, 50, 105, 36, 118, 61, 0, 36, 97, 114, 103, 111, 110, 50, 100, 36, 118, 61, 0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
var tempDoublePtr = STATICTOP;
STATICTOP += 16;

function ___setErrNo(value) {
  if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
  return value
}
var cttz_i8 = allocate([8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0], "i8", ALLOC_STATIC);

function _pthread_join() { }

function _emscripten_memcpy_big(dest, src, num) {
  HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
  return dest
}
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
staticSealed = true;
Module.asmGlobalArg = {
  "Math": Math,
  "Int8Array": Int8Array,
  "Int16Array": Int16Array,
  "Int32Array": Int32Array,
  "Uint8Array": Uint8Array,
  "Uint16Array": Uint16Array,
  "Uint32Array": Uint32Array,
  "Float32Array": Float32Array,
  "Float64Array": Float64Array,
  "NaN": NaN,
  "Infinity": Infinity
};
Module.asmLibraryArg = {
  "abort": abort,
  "assert": assert,
  "enlargeMemory": enlargeMemory,
  "getTotalMemory": getTotalMemory,
  "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
  "_pthread_join": _pthread_join,
  "_emscripten_memcpy_big": _emscripten_memcpy_big,
  "___setErrNo": ___setErrNo,
  "DYNAMICTOP_PTR": DYNAMICTOP_PTR,
  "tempDoublePtr": tempDoublePtr,
  "ABORT": ABORT,
  "STACKTOP": STACKTOP,
  "STACK_MAX": STACK_MAX,
  "cttz_i8": cttz_i8
}; // EMSCRIPTEN_START_ASM
var asm = (function (global, env, buffer) {
  "use asm";
  var a = new global.Int8Array(buffer);
  var b = new global.Int16Array(buffer);
  var c = new global.Int32Array(buffer);
  var d = new global.Uint8Array(buffer);
  var e = new global.Uint16Array(buffer);
  var f = new global.Uint32Array(buffer);
  var g = new global.Float32Array(buffer);
  var h = new global.Float64Array(buffer);
  var i = env.DYNAMICTOP_PTR | 0;
  var j = env.tempDoublePtr | 0;
  var k = env.ABORT | 0;
  var l = env.STACKTOP | 0;
  var m = env.STACK_MAX | 0;
  var n = env.cttz_i8 | 0;
  var o = 0;
  var p = 0;
  var q = 0;
  var r = 0;
  var s = global.NaN,
    t = global.Infinity;
  var u = 0,
    v = 0,
    w = 0,
    x = 0,
    y = 0.0;
  var z = 0;
  var A = global.Math.floor;
  var B = global.Math.abs;
  var C = global.Math.sqrt;
  var D = global.Math.pow;
  var E = global.Math.cos;
  var F = global.Math.sin;
  var G = global.Math.tan;
  var H = global.Math.acos;
  var I = global.Math.asin;
  var J = global.Math.atan;
  var K = global.Math.atan2;
  var L = global.Math.exp;
  var M = global.Math.log;
  var N = global.Math.ceil;
  var O = global.Math.imul;
  var P = global.Math.min;
  var Q = global.Math.max;
  var R = global.Math.clz32;
  var S = env.abort;
  var T = env.assert;
  var U = env.enlargeMemory;
  var V = env.getTotalMemory;
  var W = env.abortOnCannotGrowMemory;
  var X = env._pthread_join;
  var Y = env._emscripten_memcpy_big;
  var Z = env.___setErrNo;
  var _ = 0.0;
  // EMSCRIPTEN_START_FUNCS
  function $(a) {
    a = a | 0;
    var b = 0;
    b = l;
    l = l + a | 0;
    l = l + 15 & -16;
    return b | 0
  }

  function aa() {
    return l | 0
  }

  function ba(a) {
    a = a | 0;
    l = a
  }

  function ca(a, b) {
    a = a | 0;
    b = b | 0;
    l = a;
    m = b
  }

  function da(a, b) {
    a = a | 0;
    b = b | 0;
    if (!o) {
      o = a;
      p = b
    }
  }

  function ea(a) {
    a = a | 0;
    z = a
  }

  function fa() {
    return z | 0
  }

  function ga(a, b) {
    a = a | 0;
    b = b | 0;
    var e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0;
    if ((a | 0) == 0 | (b | 0) == 0) e = -1;
    else {
      ha(a);
      e = 0;
      do {
        h = ia(b + (e << 3) | 0) | 0;
        f = a + (e << 3) | 0;
        i = f;
        g = c[i + 4 >> 2] ^ z;
        c[f >> 2] = c[i >> 2] ^ h;
        c[f + 4 >> 2] = g;
        e = e + 1 | 0
      } while ((e | 0) != 8);
      c[a + 228 >> 2] = d[b >> 0];
      e = 0
    }
    return e | 0
  }

  function ha(a) {
    a = a | 0;
    var b = 0,
      d = 0;
    pb(a + 64 | 0, 0, 176) | 0;
    b = 8;
    d = a + 64 | 0;
    do {
      c[a >> 2] = c[b >> 2];
      a = a + 4 | 0;
      b = b + 4 | 0
    } while ((a | 0) < (d | 0));
    return
  }

  function ia(a) {
    a = a | 0;
    var b = 0;
    b = a;
    a = b;
    b = b + 4 | 0;
    z = d[b >> 0] | d[b + 1 >> 0] << 8 | d[b + 2 >> 0] << 16 | d[b + 3 >> 0] << 24;
    return d[a >> 0] | d[a + 1 >> 0] << 8 | d[a + 2 >> 0] << 16 | d[a + 3 >> 0] << 24 | 0
  }

  function ja(b, c) {
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0,
      f = 0;
    f = l;
    l = l + 64 | 0;
    e = f;
    do
      if (b)
        if ((c + -1 | 0) >>> 0 > 63) {
          ka(b);
          c = -1;
          break
        } else {
          a[e >> 0] = c;
          a[e + 1 >> 0] = 0;
          a[e + 2 >> 0] = 1;
          a[e + 3 >> 0] = 1;
          c = e + 4 | 0;
          d = c + 60 | 0;
          do {
            a[c >> 0] = 0;
            c = c + 1 | 0
          } while ((c | 0) < (d | 0));
          c = ga(b, e) | 0;
          break
        } else c = -1; while (0);
    l = f;
    return c | 0
  }

  function ka(a) {
    a = a | 0;
    na(a, 240);
    ra(a);
    return
  }

  function la(b, c, d, e) {
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0,
      h = 0,
      i = 0;
    i = l;
    l = l + 192 | 0;
    g = i + 128 | 0;
    h = i;
    do
      if (b) {
        if ((c + -1 | 0) >>> 0 > 63) {
          ka(b);
          c = -1;
          break
        }
        if ((d | 0) == 0 | (e + -1 | 0) >>> 0 > 63) {
          ka(b);
          c = -1;
          break
        }
        a[g >> 0] = c;
        a[g + 1 >> 0] = e;
        a[g + 2 >> 0] = 1;
        a[g + 3 >> 0] = 1;
        c = g + 4 | 0;
        f = c + 60 | 0;
        do {
          a[c >> 0] = 0;
          c = c + 1 | 0
        } while ((c | 0) < (f | 0));
        if ((ga(b, g) | 0) < 0) {
          ka(b);
          c = -1;
          break
        } else {
          pb(h + e | 0, 0, (e >>> 0 > 127 ? 0 : 128 - e | 0) | 0) | 0;
          xb(h | 0, d | 0, e | 0) | 0;
          ma(b, h, 128) | 0;
          na(h, 128);
          c = 0;
          break
        }
      } else c = -1;
    while (0);
    l = i;
    return c | 0
  }

  function ma(a, b, d) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0;
    if (d)
      if (!((a | 0) == 0 | (b | 0) == 0) ? (j = a + 80 | 0, (c[j >> 2] | 0) == 0 & (c[j + 4 >> 2] | 0) == 0) : 0) {
        j = a + 224 | 0;
        e = c[j >> 2] | 0;
        i = e + d | 0;
        if (i >>> 0 > 128) {
          f = 128 - e | 0;
          xb(a + 96 + e | 0, b | 0, f | 0) | 0;
          oa(a, 128, 0);
          pa(a, a + 96 | 0);
          c[j >> 2] = 0;
          d = d - f | 0;
          f = b + f | 0;
          if (d >>> 0 > 128) {
            g = i + -257 & -128;
            h = g + 256 - e | 0;
            e = f;
            while (1) {
              oa(a, 128, 0);
              pa(a, e);
              d = d + -128 | 0;
              if (d >>> 0 <= 128) break;
              else e = e + 128 | 0
            }
            d = i + -256 - g | 0;
            b = b + h | 0;
            e = c[j >> 2] | 0
          } else {
            b = f;
            e = 0
          }
        }
        xb(a + 96 + e | 0, b | 0, d | 0) | 0;
        c[j >> 2] = (c[j >> 2] | 0) + d;
        e = 0
      } else e = -1;
    else e = 0;
    return e | 0
  }

  function na(a, b) {
    a = a | 0;
    b = b | 0;
    pb(a | 0, 0, b | 0) | 0;
    return
  }

  function oa(a, b, d) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0;
    e = a + 64 | 0;
    f = e;
    f = ob(c[f >> 2] | 0, c[f + 4 >> 2] | 0, b | 0, d | 0) | 0;
    g = z;
    c[e >> 2] = f;
    c[e + 4 >> 2] = g;
    a = a + 72 | 0;
    e = a;
    b = ob((g >>> 0 < d >>> 0 | (g | 0) == (d | 0) & f >>> 0 < b >>> 0) & 1 | 0, 0, c[e >> 2] | 0, c[e + 4 >> 2] | 0) | 0;
    d = a;
    c[d >> 2] = b;
    c[d + 4 >> 2] = z;
    return
  }

  function pa(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
      u = 0,
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      A = 0,
      B = 0,
      C = 0,
      D = 0,
      E = 0,
      F = 0,
      G = 0,
      H = 0,
      I = 0,
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0,
      R = 0,
      S = 0,
      T = 0,
      U = 0,
      V = 0,
      W = 0,
      X = 0,
      Y = 0,
      Z = 0,
      _ = 0,
      $ = 0,
      aa = 0,
      ba = 0,
      ca = 0,
      da = 0,
      ea = 0,
      fa = 0,
      ga = 0,
      ha = 0,
      ja = 0,
      ka = 0,
      la = 0,
      ma = 0,
      na = 0,
      oa = 0,
      pa = 0,
      qa = 0,
      ra = 0,
      sa = 0,
      ta = 0,
      ua = 0,
      va = 0,
      xa = 0,
      ya = 0,
      za = 0,
      Aa = 0,
      Ba = 0,
      Ca = 0,
      Da = 0,
      Ea = 0,
      Fa = 0,
      Ga = 0,
      Ha = 0,
      Ia = 0;
    aa = l;
    l = l + 256 | 0;
    _ = aa + 128 | 0;
    $ = aa;
    d = 0;
    do {
      Y = ia(b + (d << 3) | 0) | 0;
      Z = _ + (d << 3) | 0;
      c[Z >> 2] = Y;
      c[Z + 4 >> 2] = z;
      d = d + 1 | 0
    } while ((d | 0) != 16);
    d = $;
    b = a;
    e = d + 64 | 0;
    do {
      c[d >> 2] = c[b >> 2];
      d = d + 4 | 0;
      b = b + 4 | 0
    } while ((d | 0) < (e | 0));
    b = $ + 64 | 0;
    e = b;
    c[e >> 2] = -205731576;
    c[e + 4 >> 2] = 1779033703;
    e = $ + 72 | 0;
    f = e;
    c[f >> 2] = -2067093701;
    c[f + 4 >> 2] = -1150833019;
    f = $ + 80 | 0;
    p = f;
    c[p >> 2] = -23791573;
    c[p + 4 >> 2] = 1013904242;
    p = $ + 88 | 0;
    m = p;
    c[m >> 2] = 1595750129;
    c[m + 4 >> 2] = -1521486534;
    m = a + 64 | 0;
    k = c[m >> 2] ^ -1377402159;
    m = c[m + 4 >> 2] ^ 1359893119;
    L = $ + 96 | 0;
    v = L;
    c[v >> 2] = k;
    c[v + 4 >> 2] = m;
    v = a + 72 | 0;
    u = c[v >> 2] ^ 725511199;
    v = c[v + 4 >> 2] ^ -1694144372;
    Q = $ + 104 | 0;
    E = Q;
    c[E >> 2] = u;
    c[E + 4 >> 2] = v;
    E = a + 80 | 0;
    D = c[E >> 2] ^ -79577749;
    E = c[E + 4 >> 2] ^ 528734635;
    R = $ + 112 | 0;
    N = R;
    c[N >> 2] = D;
    c[N + 4 >> 2] = E;
    N = a + 88 | 0;
    M = c[N >> 2] ^ 327033209;
    N = c[N + 4 >> 2] ^ 1541459225;
    S = $ + 120 | 0;
    T = S;
    c[T >> 2] = M;
    c[T + 4 >> 2] = N;
    T = $ + 32 | 0;
    U = $ + 8 | 0;
    V = $ + 40 | 0;
    W = $ + 16 | 0;
    X = $ + 48 | 0;
    Y = $ + 24 | 0;
    Z = $ + 56 | 0;
    j = $;
    h = T;
    t = U;
    r = V;
    C = W;
    A = X;
    K = Y;
    I = Z;
    d = 0;
    g = c[h >> 2] | 0;
    h = c[h + 4 >> 2] | 0;
    i = c[j >> 2] | 0;
    j = c[j + 4 >> 2] | 0;
    n = -205731576;
    o = 1779033703;
    q = c[r >> 2] | 0;
    r = c[r + 4 >> 2] | 0;
    s = c[t >> 2] | 0;
    t = c[t + 4 >> 2] | 0;
    w = -2067093701;
    x = -1150833019;
    y = c[A >> 2] | 0;
    A = c[A + 4 >> 2] | 0;
    B = c[C >> 2] | 0;
    C = c[C + 4 >> 2] | 0;
    F = -23791573;
    G = 1013904242;
    H = c[I >> 2] | 0;
    I = c[I + 4 >> 2] | 0;
    J = c[K >> 2] | 0;
    K = c[K + 4 >> 2] | 0;
    O = 1595750129;
    P = -1521486534;
    do {
      Ia = ob(g | 0, h | 0, i | 0, j | 0) | 0;
      Ha = _ + (c[72 + (d << 6) >> 2] << 3) | 0;
      Ha = ob(Ia | 0, z | 0, c[Ha >> 2] | 0, c[Ha + 4 >> 2] | 0) | 0;
      Ia = z;
      ya = wa(k ^ Ha, m ^ Ia, 32) | 0;
      xa = z;
      na = ob(n | 0, o | 0, ya | 0, xa | 0) | 0;
      ma = z;
      ca = wa(g ^ na, h ^ ma, 24) | 0;
      ba = z;
      Ia = ob(Ha | 0, Ia | 0, ca | 0, ba | 0) | 0;
      Ha = _ + (c[72 + (d << 6) + 4 >> 2] << 3) | 0;
      Ha = ob(Ia | 0, z | 0, c[Ha >> 2] | 0, c[Ha + 4 >> 2] | 0) | 0;
      Ia = z;
      xa = wa(ya ^ Ha, xa ^ Ia, 16) | 0;
      ya = z;
      ma = ob(na | 0, ma | 0, xa | 0, ya | 0) | 0;
      na = z;
      ba = wa(ca ^ ma, ba ^ na, 63) | 0;
      ca = z;
      Aa = ob(q | 0, r | 0, s | 0, t | 0) | 0;
      za = _ + (c[72 + (d << 6) + 8 >> 2] << 3) | 0;
      za = ob(Aa | 0, z | 0, c[za >> 2] | 0, c[za + 4 >> 2] | 0) | 0;
      Aa = z;
      pa = wa(u ^ za, v ^ Aa, 32) | 0;
      oa = z;
      ea = ob(w | 0, x | 0, pa | 0, oa | 0) | 0;
      da = z;
      Ca = wa(q ^ ea, r ^ da, 24) | 0;
      Ba = z;
      Aa = ob(za | 0, Aa | 0, Ca | 0, Ba | 0) | 0;
      za = _ + (c[72 + (d << 6) + 12 >> 2] << 3) | 0;
      za = ob(Aa | 0, z | 0, c[za >> 2] | 0, c[za + 4 >> 2] | 0) | 0;
      Aa = z;
      oa = wa(pa ^ za, oa ^ Aa, 16) | 0;
      pa = z;
      da = ob(ea | 0, da | 0, oa | 0, pa | 0) | 0;
      ea = z;
      Ba = wa(Ca ^ da, Ba ^ ea, 63) | 0;
      Ca = z;
      ra = ob(y | 0, A | 0, B | 0, C | 0) | 0;
      qa = _ + (c[72 + (d << 6) + 16 >> 2] << 3) | 0;
      qa = ob(ra | 0, z | 0, c[qa >> 2] | 0, c[qa + 4 >> 2] | 0) | 0;
      ra = z;
      ga = wa(D ^ qa, E ^ ra, 32) | 0;
      fa = z;
      Ea = ob(F | 0, G | 0, ga | 0, fa | 0) | 0;
      Da = z;
      ta = wa(y ^ Ea, A ^ Da, 24) | 0;
      sa = z;
      ra = ob(qa | 0, ra | 0, ta | 0, sa | 0) | 0;
      qa = _ + (c[72 + (d << 6) + 20 >> 2] << 3) | 0;
      qa = ob(ra | 0, z | 0, c[qa >> 2] | 0, c[qa + 4 >> 2] | 0) | 0;
      ra = z;
      fa = wa(ga ^ qa, fa ^ ra, 16) | 0;
      ga = z;
      Da = ob(Ea | 0, Da | 0, fa | 0, ga | 0) | 0;
      Ea = z;
      sa = wa(ta ^ Da, sa ^ Ea, 63) | 0;
      ta = z;
      ja = ob(H | 0, I | 0, J | 0, K | 0) | 0;
      ha = _ + (c[72 + (d << 6) + 24 >> 2] << 3) | 0;
      ha = ob(ja | 0, z | 0, c[ha >> 2] | 0, c[ha + 4 >> 2] | 0) | 0;
      ja = z;
      Ga = wa(M ^ ha, N ^ ja, 32) | 0;
      Fa = z;
      va = ob(O | 0, P | 0, Ga | 0, Fa | 0) | 0;
      ua = z;
      la = wa(H ^ va, I ^ ua, 24) | 0;
      ka = z;
      ja = ob(ha | 0, ja | 0, la | 0, ka | 0) | 0;
      ha = _ + (c[72 + (d << 6) + 28 >> 2] << 3) | 0;
      ha = ob(ja | 0, z | 0, c[ha >> 2] | 0, c[ha + 4 >> 2] | 0) | 0;
      ja = z;
      Fa = wa(Ga ^ ha, Fa ^ ja, 16) | 0;
      Ga = z;
      ua = ob(va | 0, ua | 0, Fa | 0, Ga | 0) | 0;
      va = z;
      ka = wa(la ^ ua, ka ^ va, 63) | 0;
      la = z;
      Ia = ob(Ba | 0, Ca | 0, Ha | 0, Ia | 0) | 0;
      Ha = _ + (c[72 + (d << 6) + 32 >> 2] << 3) | 0;
      Ha = ob(Ia | 0, z | 0, c[Ha >> 2] | 0, c[Ha + 4 >> 2] | 0) | 0;
      Ia = z;
      Ga = wa(Fa ^ Ha, Ga ^ Ia, 32) | 0;
      Fa = z;
      Ea = ob(Da | 0, Ea | 0, Ga | 0, Fa | 0) | 0;
      Da = z;
      Ca = wa(Ba ^ Ea, Ca ^ Da, 24) | 0;
      Ba = z;
      Ia = ob(Ha | 0, Ia | 0, Ca | 0, Ba | 0) | 0;
      Ha = _ + (c[72 + (d << 6) + 36 >> 2] << 3) | 0;
      i = ob(Ia | 0, z | 0, c[Ha >> 2] | 0, c[Ha + 4 >> 2] | 0) | 0;
      j = z;
      M = wa(Ga ^ i, Fa ^ j, 16) | 0;
      N = z;
      F = ob(Ea | 0, Da | 0, M | 0, N | 0) | 0;
      G = z;
      q = wa(Ca ^ F, Ba ^ G, 63) | 0;
      r = z;
      Aa = ob(sa | 0, ta | 0, za | 0, Aa | 0) | 0;
      za = _ + (c[72 + (d << 6) + 40 >> 2] << 3) | 0;
      za = ob(Aa | 0, z | 0, c[za >> 2] | 0, c[za + 4 >> 2] | 0) | 0;
      Aa = z;
      ya = wa(xa ^ za, ya ^ Aa, 32) | 0;
      xa = z;
      va = ob(ua | 0, va | 0, ya | 0, xa | 0) | 0;
      ua = z;
      ta = wa(sa ^ va, ta ^ ua, 24) | 0;
      sa = z;
      Aa = ob(za | 0, Aa | 0, ta | 0, sa | 0) | 0;
      za = _ + (c[72 + (d << 6) + 44 >> 2] << 3) | 0;
      s = ob(Aa | 0, z | 0, c[za >> 2] | 0, c[za + 4 >> 2] | 0) | 0;
      t = z;
      k = wa(ya ^ s, xa ^ t, 16) | 0;
      m = z;
      O = ob(va | 0, ua | 0, k | 0, m | 0) | 0;
      P = z;
      y = wa(ta ^ O, sa ^ P, 63) | 0;
      A = z;
      ra = ob(ka | 0, la | 0, qa | 0, ra | 0) | 0;
      qa = _ + (c[72 + (d << 6) + 48 >> 2] << 3) | 0;
      qa = ob(ra | 0, z | 0, c[qa >> 2] | 0, c[qa + 4 >> 2] | 0) | 0;
      ra = z;
      pa = wa(oa ^ qa, pa ^ ra, 32) | 0;
      oa = z;
      na = ob(ma | 0, na | 0, pa | 0, oa | 0) | 0;
      ma = z;
      la = wa(ka ^ na, la ^ ma, 24) | 0;
      ka = z;
      ra = ob(qa | 0, ra | 0, la | 0, ka | 0) | 0;
      qa = _ + (c[72 + (d << 6) + 52 >> 2] << 3) | 0;
      B = ob(ra | 0, z | 0, c[qa >> 2] | 0, c[qa + 4 >> 2] | 0) | 0;
      C = z;
      u = wa(pa ^ B, oa ^ C, 16) | 0;
      v = z;
      n = ob(na | 0, ma | 0, u | 0, v | 0) | 0;
      o = z;
      H = wa(la ^ n, ka ^ o, 63) | 0;
      I = z;
      ja = ob(ba | 0, ca | 0, ha | 0, ja | 0) | 0;
      ha = _ + (c[72 + (d << 6) + 56 >> 2] << 3) | 0;
      ha = ob(ja | 0, z | 0, c[ha >> 2] | 0, c[ha + 4 >> 2] | 0) | 0;
      ja = z;
      ga = wa(fa ^ ha, ga ^ ja, 32) | 0;
      fa = z;
      ea = ob(da | 0, ea | 0, ga | 0, fa | 0) | 0;
      da = z;
      ca = wa(ba ^ ea, ca ^ da, 24) | 0;
      ba = z;
      ja = ob(ha | 0, ja | 0, ca | 0, ba | 0) | 0;
      ha = _ + (c[72 + (d << 6) + 60 >> 2] << 3) | 0;
      J = ob(ja | 0, z | 0, c[ha >> 2] | 0, c[ha + 4 >> 2] | 0) | 0;
      K = z;
      D = wa(ga ^ J, fa ^ K, 16) | 0;
      E = z;
      w = ob(ea | 0, da | 0, D | 0, E | 0) | 0;
      x = z;
      g = wa(ca ^ w, ba ^ x, 63) | 0;
      h = z;
      d = d + 1 | 0
    } while ((d | 0) != 12);
    Ga = $;
    c[Ga >> 2] = i;
    c[Ga + 4 >> 2] = j;
    Ga = T;
    c[Ga >> 2] = g;
    c[Ga + 4 >> 2] = h;
    Ga = L;
    c[Ga >> 2] = k;
    c[Ga + 4 >> 2] = m;
    Ga = b;
    c[Ga >> 2] = n;
    c[Ga + 4 >> 2] = o;
    Ga = U;
    c[Ga >> 2] = s;
    c[Ga + 4 >> 2] = t;
    Ga = V;
    c[Ga >> 2] = q;
    c[Ga + 4 >> 2] = r;
    Ga = Q;
    c[Ga >> 2] = u;
    c[Ga + 4 >> 2] = v;
    Ga = e;
    c[Ga >> 2] = w;
    c[Ga + 4 >> 2] = x;
    Ga = W;
    c[Ga >> 2] = B;
    c[Ga + 4 >> 2] = C;
    Ga = X;
    c[Ga >> 2] = y;
    c[Ga + 4 >> 2] = A;
    Ga = R;
    c[Ga >> 2] = D;
    c[Ga + 4 >> 2] = E;
    Ga = f;
    c[Ga >> 2] = F;
    c[Ga + 4 >> 2] = G;
    Ga = Y;
    c[Ga >> 2] = J;
    c[Ga + 4 >> 2] = K;
    Ga = Z;
    c[Ga >> 2] = H;
    c[Ga + 4 >> 2] = I;
    Ga = S;
    c[Ga >> 2] = M;
    c[Ga + 4 >> 2] = N;
    Ga = p;
    c[Ga >> 2] = O;
    c[Ga + 4 >> 2] = P;
    Ga = a;
    Ha = $ + 64 | 0;
    Ia = j ^ c[Ga + 4 >> 2] ^ c[Ha + 4 >> 2];
    d = a;
    c[d >> 2] = i ^ c[Ga >> 2] ^ c[Ha >> 2];
    c[d + 4 >> 2] = Ia;
    d = 1;
    do {
      Ea = $ + (d << 3) | 0;
      Ia = a + (d << 3) | 0;
      Fa = Ia;
      Ga = $ + (d + 8 << 3) | 0;
      Ha = c[Ea + 4 >> 2] ^ c[Fa + 4 >> 2] ^ c[Ga + 4 >> 2];
      c[Ia >> 2] = c[Ea >> 2] ^ c[Fa >> 2] ^ c[Ga >> 2];
      c[Ia + 4 >> 2] = Ha;
      d = d + 1 | 0
    } while ((d | 0) != 8);
    l = aa;
    return
  }

  function qa(b, d, e) {
    b = b | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0;
    j = l;
    l = l + 64 | 0;
    h = j;
    f = h;
    g = f + 64 | 0;
    do {
      a[f >> 0] = 0;
      f = f + 1 | 0
    } while ((f | 0) < (g | 0));
    if ((!((b | 0) == 0 | (d | 0) == 0) ? (i = b + 228 | 0, (c[i >> 2] | 0) >>> 0 <= e >>> 0) : 0) ? (g = b + 80 | 0, (c[g >> 2] | 0) == 0 & (c[g + 4 >> 2] | 0) == 0) : 0) {
      f = b + 224 | 0;
      oa(b, c[f >> 2] | 0, 0);
      ra(b);
      f = c[f >> 2] | 0;
      pb(b + 96 + f | 0, 0, 128 - f | 0) | 0;
      f = b + 96 | 0;
      pa(b, f);
      e = 0;
      do {
        g = b + (e << 3) | 0;
        sa(h + (e << 3) | 0, c[g >> 2] | 0, c[g + 4 >> 2] | 0);
        e = e + 1 | 0
      } while ((e | 0) != 8);
      xb(d | 0, h | 0, c[i >> 2] | 0) | 0;
      na(h, 64);
      na(f, 128);
      na(b, 64);
      e = 0
    } else e = -1;
    l = j;
    return e | 0
  }

  function ra(b) {
    b = b | 0;
    if (a[b + 232 >> 0] | 0) xa(b);
    b = b + 80 | 0;
    c[b >> 2] = -1;
    c[b + 4 >> 2] = -1;
    return
  }

  function sa(b, c, d) {
    b = b | 0;
    c = c | 0;
    d = d | 0;
    var e = 0;
    e = b;
    a[e >> 0] = c;
    a[e + 1 >> 0] = c >> 8;
    a[e + 2 >> 0] = c >> 16;
    a[e + 3 >> 0] = c >> 24;
    c = b + 4 | 0;
    a[c >> 0] = d;
    a[c + 1 >> 0] = d >> 8;
    a[c + 2 >> 0] = d >> 16;
    a[c + 3 >> 0] = d >> 24;
    return
  }

  function ta(a, b, c, d, e, f) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    var g = 0,
      h = 0,
      i = 0;
    i = l;
    l = l + 240 | 0;
    h = i;
    do
      if ((!((c | 0) == 0 & (d | 0) != 0) ? !((a | 0) == 0 | (b + -1 | 0) >>> 0 > 63) : 0) ? (g = (f | 0) != 0, !(f >>> 0 > 64 | (e | 0) == 0 & g)) : 0) {
        if (g) {
          if ((la(h, b, e, f) | 0) < 0) {
            a = -1;
            break
          }
        } else if ((ja(h, b) | 0) < 0) {
          a = -1;
          break
        }
        if ((ma(h, c, d) | 0) >= 0) a = qa(h, a, b) | 0;
        else a = -1
      } else a = -1;
    while (0);
    na(h, 240);
    l = i;
    return a | 0
  }

  function ua(b, d, e, f) {
    b = b | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    var g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0,
      o = 0;
    o = l;
    l = l + 384 | 0;
    n = o;
    h = o + 240 | 0;
    m = o + 312 | 0;
    k = o + 248 | 0;
    c[h >> 2] = 0;
    va(h, d);
    if (d >>> 0 < 65) {
      g = ja(n, d) | 0;
      if ((g | 0) >= 0) {
        g = ma(n, h, 4) | 0;
        if ((g | 0) >= 0) {
          g = ma(n, e, f) | 0;
          if ((g | 0) >= 0) g = qa(n, b, d) | 0
        }
      }
    } else {
      g = ja(n, 64) | 0;
      a: do
        if ((g | 0) >= 0) {
          g = ma(n, h, 4) | 0;
          if ((g | 0) >= 0) {
            g = ma(n, e, f) | 0;
            if ((g | 0) >= 0) {
              g = qa(n, m, 64) | 0;
              if ((g | 0) >= 0) {
                f = b;
                i = m;
                j = f + 32 | 0;
                do {
                  a[f >> 0] = a[i >> 0] | 0;
                  f = f + 1 | 0;
                  i = i + 1 | 0
                } while ((f | 0) < (j | 0));
                e = d + -32 | 0;
                h = b + 32 | 0;
                g = e >>> 0 > 64;
                f = k;
                i = m;
                j = f + 64 | 0;
                do {
                  a[f >> 0] = a[i >> 0] | 0;
                  f = f + 1 | 0;
                  i = i + 1 | 0
                } while ((f | 0) < (j | 0));
                if (g)
                  do {
                    g = ta(m, 64, k, 64, 0, 0) | 0;
                    if ((g | 0) < 0) break a;
                    f = h;
                    i = m;
                    j = f + 32 | 0;
                    do {
                      a[f >> 0] = a[i >> 0] | 0;
                      f = f + 1 | 0;
                      i = i + 1 | 0
                    } while ((f | 0) < (j | 0));
                    e = e + -32 | 0;
                    h = h + 32 | 0;
                    g = e >>> 0 > 64;
                    f = k;
                    i = m;
                    j = f + 64 | 0;
                    do {
                      a[f >> 0] = a[i >> 0] | 0;
                      f = f + 1 | 0;
                      i = i + 1 | 0
                    } while ((f | 0) < (j | 0))
                  } while (g);
                g = ta(m, e, k, 64, 0, 0) | 0;
                if ((g | 0) >= 0) xb(h | 0, m | 0, e | 0) | 0
              }
            }
          }
        }
      while (0)
    }
    na(n, 240);
    l = o;
    return g | 0
  }

  function va(b, c) {
    b = b | 0;
    c = c | 0;
    a[b >> 0] = c;
    a[b + 1 >> 0] = c >> 8;
    a[b + 2 >> 0] = c >> 16;
    a[b + 3 >> 0] = c >> 24;
    return
  }

  function wa(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0;
    d = qb(a | 0, b | 0, c | 0) | 0;
    e = z;
    c = rb(a | 0, b | 0, 64 - c | 0) | 0;
    z = z | e;
    return c | d | 0
  }

  function xa(a) {
    a = a | 0;
    a = a + 88 | 0;
    c[a >> 2] = -1;
    c[a + 4 >> 2] = -1;
    return
  }

  function ya(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0;
    f = l;
    l = l + 48 | 0;
    e = f;
    d = Na(a) | 0;
    if (!d)
      if (b >>> 0 <= 1) {
        g = c[a + 44 >> 2] | 0;
        d = c[a + 48 >> 2] | 0;
        i = d << 3;
        h = d << 2;
        g = ((g >>> 0 < i >>> 0 ? i : g) >>> 0) / (h >>> 0) | 0;
        h = O(g, h) | 0;
        c[e + 4 >> 2] = c[a + 56 >> 2];
        c[e >> 2] = 0;
        c[e + 8 >> 2] = c[a + 40 >> 2];
        c[e + 12 >> 2] = h;
        c[e + 16 >> 2] = g;
        c[e + 20 >> 2] = g << 2;
        c[e + 24 >> 2] = d;
        c[e + 28 >> 2] = c[a + 52 >> 2];
        c[e + 32 >> 2] = b;
        d = Ta(e, a) | 0;
        if (!d) {
          d = Ma(e) | 0;
          if (!d) {
            Ia(a, e);
            d = 0
          }
        }
      } else d = -26;
    l = f;
    return d | 0
  }

  function za(a, b, d, e, f, g, h, i, j, k, m, n, o) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    g = g | 0;
    h = h | 0;
    i = i | 0;
    j = j | 0;
    k = k | 0;
    m = m | 0;
    n = n | 0;
    o = o | 0;
    var p = 0,
      q = 0,
      r = 0;
    r = l;
    l = l + 80 | 0;
    p = r;
    do
      if (j >>> 0 >= 4) {
        q = db(j) | 0;
        if (!q) a = -22;
        else {
          c[p >> 2] = q;
          c[p + 4 >> 2] = j;
          c[p + 8 >> 2] = e;
          c[p + 12 >> 2] = f;
          c[p + 16 >> 2] = g;
          c[p + 20 >> 2] = h;
          h = p + 24 | 0;
          c[h >> 2] = 0;
          c[h + 4 >> 2] = 0;
          c[h + 8 >> 2] = 0;
          c[h + 12 >> 2] = 0;
          c[p + 40 >> 2] = a;
          c[p + 44 >> 2] = b;
          c[p + 48 >> 2] = d;
          c[p + 52 >> 2] = d;
          c[p + 60 >> 2] = 0;
          c[p + 64 >> 2] = 0;
          c[p + 68 >> 2] = 4;
          c[p + 56 >> 2] = o;
          a = ya(p, n) | 0;
          if (a | 0) {
            Fa(q, j);
            eb(q);
            break
          }
          if (i | 0) xb(i | 0, q | 0, j | 0) | 0;
          if ((k | 0) != 0 & (m | 0) != 0 ? Va(k, m, p, n) | 0 : 0) {
            Fa(q, j);
            Fa(k, m);
            eb(q);
            a = -31;
            break
          }
          Fa(q, j);
          eb(q);
          a = 0
        }
      } else a = -2;
    while (0);
    l = r;
    return a | 0
  }

  function Aa(a) {
    a = a | 0;
    do switch (a | 0) {
      case 0:
        {
          a = 2060;
          break
        }
      case -1:
        {
          a = 2037;
          break
        }
      case -2:
        {
          a = 2017;
          break
        }
      case -3:
        {
          a = 1998;
          break
        }
      case -4:
        {
          a = 1976;
          break
        }
      case -5:
        {
          a = 1955;
          break
        }
      case -6:
        {
          a = 1937;
          break
        }
      case -7:
        {
          a = 1920;
          break
        }
      case -8:
        {
          a = 1891;
          break
        }
      case -9:
        {
          a = 1863;
          break
        }
      case -10:
        {
          a = 1843;
          break
        }
      case -11:
        {
          a = 1824;
          break
        }
      case -12:
        {
          a = 1801;
          break
        }
      case -13:
        {
          a = 1778;
          break
        }
      case -14:
        {
          a = 1753;
          break
        }
      case -15:
        {
          a = 1728;
          break
        }
      case -16:
        {
          a = 1714;
          break
        }
      case -17:
        {
          a = 1699;
          break
        }
      case -18:
        {
          a = 1644;
          break
        }
      case -19:
        {
          a = 1597;
          break
        }
      case -20:
        {
          a = 1546;
          break
        }
      case -21:
        {
          a = 1490;
          break
        }
      case -22:
        {
          a = 1466;
          break
        }
      case -23:
        {
          a = 1433;
          break
        }
      case -24:
        {
          a = 1396;
          break
        }
      case -25:
        {
          a = 1365;
          break
        }
      case -26:
        {
          a = 1330;
          break
        }
      case -27:
        {
          a = 1306;
          break
        }
      case -28:
        {
          a = 1287;
          break
        }
      case -29:
        {
          a = 1270;
          break
        }
      case -30:
        {
          a = 1252;
          break
        }
      case -31:
        {
          a = 1236;
          break
        }
      case -32:
        {
          a = 1220;
          break
        }
      case -33:
        {
          a = 1202;
          break
        }
      case -34:
        {
          a = 1149;
          break
        }
      case -35:
        {
          a = 1103;
          break
        }
      default:
        a = 1084
    }
    while (0);
    return a | 0
  }

  function Ba(a, b) {
    a = a | 0;
    b = b | 0;
    pb(a | 0, b | 0, 1024) | 0;
    return
  }

  function Ca(a, b) {
    a = a | 0;
    b = b | 0;
    xb(a | 0, b | 0, 1024) | 0;
    return
  }

  function Da(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0;
    d = 0;
    do {
      g = b + (d << 3) | 0;
      e = a + (d << 3) | 0;
      h = e;
      f = c[h + 4 >> 2] ^ c[g + 4 >> 2];
      c[e >> 2] = c[h >> 2] ^ c[g >> 2];
      c[e + 4 >> 2] = f;
      d = d + 1 | 0
    } while ((d | 0) != 128);
    return
  }

  function Ea(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0;
    do
      if (!a) a = -22;
      else {
        d = b << 10;
        if (b | 0 ? ((d >>> 0) / (b >>> 0) | 0 | 0) != 1024 : 0) {
          a = -22;
          break
        }
        d = db(d) | 0;
        c[a >> 2] = d;
        a = (d | 0) == 0 ? -22 : 0
      }
    while (0);
    return a | 0
  }

  function Fa(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0;
    d = l;
    l = l + 16 | 0;
    f = d + 4 | 0;
    e = d;
    c[f >> 2] = a;
    c[e >> 2] = b;
    pb(c[f >> 2] | 0, 0, c[e >> 2] | 0) | 0;
    l = d;
    return
  }

  function Ga(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0;
    d = c[a >> 2] | 0;
    if ((b | 0) != 0 & (d | 0) != 0) Fa(d, c[a + 12 >> 2] << 10);
    return
  }

  function Ha(a) {
    a = a | 0;
    eb(a);
    return
  }

  function Ia(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0;
    i = l;
    l = l + 2048 | 0;
    f = i;
    g = i + 1024 | 0;
    if ((a | 0) != 0 & (b | 0) != 0) {
      h = b + 20 | 0;
      Ca(f, (c[b >> 2] | 0) + (c[h >> 2] << 10) + -1024 | 0);
      e = b + 24 | 0;
      if ((c[e >> 2] | 0) >>> 0 > 1) {
        d = 1;
        do {
          j = c[h >> 2] | 0;
          j = j + -1 + (O(j, d) | 0) | 0;
          Da(f, (c[b >> 2] | 0) + (j << 10) | 0);
          d = d + 1 | 0
        } while (d >>> 0 < (c[e >> 2] | 0) >>> 0)
      }
      Ja(g, f);
      ua(c[a >> 2] | 0, c[a + 4 >> 2] | 0, g, 1024) | 0;
      Fa(f, 1024);
      Fa(g, 1024);
      Ga(b, c[a + 68 >> 2] & 1);
      Ha(c[b >> 2] | 0)
    }
    l = i;
    return
  }

  function Ja(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0;
    d = 0;
    do {
      e = b + (d << 3) | 0;
      Ka(a + (d << 3) | 0, c[e >> 2] | 0, c[e + 4 >> 2] | 0);
      d = d + 1 | 0
    } while ((d | 0) != 128);
    return
  }

  function Ka(b, c, d) {
    b = b | 0;
    c = c | 0;
    d = d | 0;
    var e = 0;
    e = b;
    a[e >> 0] = c;
    a[e + 1 >> 0] = c >> 8;
    a[e + 2 >> 0] = c >> 16;
    a[e + 3 >> 0] = c >> 24;
    c = b + 4 | 0;
    a[c >> 0] = d;
    a[c + 1 >> 0] = d >> 8;
    a[c + 2 >> 0] = d >> 16;
    a[c + 3 >> 0] = d >> 24;
    return
  }

  function La(b, d, e, f) {
    b = b | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    var g = 0,
      h = 0,
      i = 0,
      j = 0;
    j = (c[d >> 2] | 0) == 0;
    h = c[d + 12 >> 2] | 0;
    do
      if (j) {
        g = a[d + 8 >> 0] | 0;
        if (!(g << 24 >> 24)) {
          g = h + -1 | 0;
          break
        }
        g = O(c[b + 16 >> 2] | 0, g & 255) | 0;
        if (!f) {
          g = g + (((h | 0) == 0) << 31 >> 31) | 0;
          break
        } else {
          g = h + -1 + g | 0;
          break
        }
      } else {
        g = (c[b + 20 >> 2] | 0) - (c[b + 16 >> 2] | 0) | 0;
        if (!f) {
          g = g + (((h | 0) == 0) << 31 >> 31) | 0;
          break
        } else {
          g = h + -1 + g | 0;
          break
        }
      }
    while (0);
    wb(e | 0, 0, e | 0, 0) | 0;
    wb(g | 0, 0, z | 0, 0) | 0;
    h = mb(g + -1 | 0, 0, z | 0, 0) | 0;
    e = z;
    if (!j ? (i = a[d + 8 >> 0] | 0, i << 24 >> 24 != 3) : 0) {
      g = O(c[b + 16 >> 2] | 0, (i & 255) + 1 | 0) | 0;
      f = 0
    } else {
      g = 0;
      f = 0
    }
    j = ob(h | 0, e | 0, g | 0, f | 0) | 0;
    b = ub(j | 0, z | 0, c[b + 20 >> 2] | 0, 0) | 0;
    return b | 0
  }

  function Ma(b) {
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0;
    s = l;
    l = l + 32 | 0;
    i = s + 16 | 0;
    j = s;
    a: do
      if ((b | 0) != 0 ? (p = b + 24 | 0, d = c[p >> 2] | 0, (d | 0) != 0) : 0) {
        q = fb(d, 4) | 0;
        if (!q) d = -22;
        else {
          r = b + 8 | 0;
          b: do
            if (c[r >> 2] | 0) {
              k = b + 28 | 0;
              m = j + 4 | 0;
              n = j + 8 | 0;
              o = j + 12 | 0;
              h = 0;
              c: while (1) {
                g = 0;
                do {
                  if (!d) d = 0;
                  else {
                    f = g & 255;
                    e = 0;
                    do {
                      d = c[k >> 2] | 0;
                      if (e >>> 0 >= d >>> 0 ? cb(c[q + (e - d << 2) >> 2] | 0) | 0 : 0) break c;
                      c[j >> 2] = h;
                      c[m >> 2] = e;
                      a[n >> 0] = f;
                      c[o >> 2] = 0;
                      c[i >> 2] = c[j >> 2];
                      c[i + 4 >> 2] = c[j + 4 >> 2];
                      c[i + 8 >> 2] = c[j + 8 >> 2];
                      c[i + 12 >> 2] = c[j + 12 >> 2];
                      bb(b, i);
                      e = e + 1 | 0;
                      d = c[p >> 2] | 0
                    } while (e >>> 0 < d >>> 0)
                  }
                  e = d - (c[k >> 2] | 0) | 0;
                  if (e >>> 0 < d >>> 0)
                    do {
                      if (cb(c[q + (e << 2) >> 2] | 0) | 0) {
                        d = -33;
                        break a
                      }
                      e = e + 1 | 0;
                      d = c[p >> 2] | 0
                    } while (e >>> 0 < d >>> 0);
                  g = g + 1 | 0
                } while (g >>> 0 < 4);
                h = h + 1 | 0;
                if (h >>> 0 >= (c[r >> 2] | 0) >>> 0) break b
              }
              eb(q);
              d = -33;
              break a
            }
          while (0);
          eb(q);
          d = 0
        }
      } else d = -33;
    while (0);
    l = s;
    return d | 0
  }

  function Na(a) {
    a = a | 0;
    var b = 0,
      d = 0;
    do
      if (a)
        if (c[a >> 2] | 0)
          if ((c[a + 4 >> 2] | 0) >>> 0 >= 4) {
            if ((c[a + 8 >> 2] | 0) == 0 ? c[a + 12 >> 2] | 0 : 0) {
              b = -18;
              break
            }
            b = c[a + 20 >> 2] | 0;
            if (!(c[a + 16 >> 2] | 0)) {
              if (b | 0) {
                b = -19;
                break
              }
            } else if (b >>> 0 < 8) {
              b = -6;
              break
            }
            if ((c[a + 24 >> 2] | 0) == 0 ? c[a + 28 >> 2] | 0 : 0) {
              b = -20;
              break
            }
            if ((c[a + 32 >> 2] | 0) == 0 ? c[a + 36 >> 2] | 0 : 0) {
              b = -21;
              break
            }
            b = c[a + 44 >> 2] | 0;
            if (b >>> 0 >= 8)
              if (b >>> 0 <= 2097152) {
                d = c[a + 48 >> 2] | 0;
                if (b >>> 0 >= d << 3 >>> 0)
                  if (c[a + 40 >> 2] | 0)
                    if (d)
                      if (d >>> 0 <= 16777215) {
                        b = c[a + 52 >> 2] | 0;
                        if (b)
                          if (b >>> 0 > 16777215) b = -29;
                          else {
                            b = (c[a + 64 >> 2] | 0) == 0;
                            if (!(c[a + 60 >> 2] | 0)) {
                              if (!b) {
                                b = -24;
                                break
                              }
                            } else if (b) {
                              b = -23;
                              break
                            }
                            b = 0
                          } else b = -28
                      } else b = -17;
                    else b = -16;
                  else b = -12;
                else b = -14
              } else b = -15;
            else b = -14
          } else b = -2;
        else b = -1;
      else b = -25;
    while (0);
    return b | 0
  }

  function Oa(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0;
    j = l;
    l = l + 1024 | 0;
    e = j;
    f = b + 24 | 0;
    if (c[f >> 2] | 0) {
      g = a + 64 | 0;
      h = a + 68 | 0;
      i = b + 20 | 0;
      d = 0;
      do {
        Pa(g, 0);
        Pa(h, d);
        ua(e, 1024, a, 72) | 0;
        Qa((c[b >> 2] | 0) + ((O(c[i >> 2] | 0, d) | 0) << 10) | 0, e);
        Pa(g, 1);
        ua(e, 1024, a, 72) | 0;
        Qa((c[b >> 2] | 0) + ((O(c[i >> 2] | 0, d) | 0) + 1 << 10) | 0, e);
        d = d + 1 | 0
      } while (d >>> 0 < (c[f >> 2] | 0) >>> 0)
    }
    Fa(e, 1024);
    l = j;
    return
  }

  function Pa(b, c) {
    b = b | 0;
    c = c | 0;
    a[b >> 0] = c;
    a[b + 1 >> 0] = c >> 8;
    a[b + 2 >> 0] = c >> 16;
    a[b + 3 >> 0] = c >> 24;
    return
  }

  function Qa(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0;
    d = 0;
    do {
      f = Ra(b + (d << 3) | 0) | 0;
      e = a + (d << 3) | 0;
      c[e >> 2] = f;
      c[e + 4 >> 2] = z;
      d = d + 1 | 0
    } while ((d | 0) != 128);
    return
  }

  function Ra(a) {
    a = a | 0;
    var b = 0;
    b = a;
    a = b;
    b = b + 4 | 0;
    z = d[b >> 0] | d[b + 1 >> 0] << 8 | d[b + 2 >> 0] << 16 | d[b + 3 >> 0] << 24;
    return d[a >> 0] | d[a + 1 >> 0] << 8 | d[a + 2 >> 0] << 16 | d[a + 3 >> 0] << 24 | 0
  }

  function Sa(a, b, d) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0;
    i = l;
    l = l + 256 | 0;
    h = i;
    g = i + 240 | 0;
    if (!((a | 0) == 0 | (b | 0) == 0)) {
      ja(h, 64) | 0;
      Pa(g, c[b + 48 >> 2] | 0);
      ma(h, g, 4) | 0;
      Pa(g, c[b + 4 >> 2] | 0);
      ma(h, g, 4) | 0;
      Pa(g, c[b + 44 >> 2] | 0);
      ma(h, g, 4) | 0;
      Pa(g, c[b + 40 >> 2] | 0);
      ma(h, g, 4) | 0;
      Pa(g, c[b + 56 >> 2] | 0);
      ma(h, g, 4) | 0;
      Pa(g, d);
      ma(h, g, 4) | 0;
      d = b + 12 | 0;
      Pa(g, c[d >> 2] | 0);
      ma(h, g, 4) | 0;
      e = b + 8 | 0;
      f = c[e >> 2] | 0;
      if (f | 0 ? (ma(h, f, c[d >> 2] | 0) | 0, c[b + 68 >> 2] & 1 | 0) : 0) {
        Fa(c[e >> 2] | 0, c[d >> 2] | 0);
        c[d >> 2] = 0
      }
      d = b + 20 | 0;
      Pa(g, c[d >> 2] | 0);
      ma(h, g, 4) | 0;
      e = c[b + 16 >> 2] | 0;
      if (e | 0) ma(h, e, c[d >> 2] | 0) | 0;
      d = b + 28 | 0;
      Pa(g, c[d >> 2] | 0);
      ma(h, g, 4) | 0;
      e = b + 24 | 0;
      f = c[e >> 2] | 0;
      if (f | 0 ? (ma(h, f, c[d >> 2] | 0) | 0, c[b + 68 >> 2] & 2 | 0) : 0) {
        Fa(c[e >> 2] | 0, c[d >> 2] | 0);
        c[d >> 2] = 0
      }
      e = b + 36 | 0;
      Pa(g, c[e >> 2] | 0);
      ma(h, g, 4) | 0;
      d = c[b + 32 >> 2] | 0;
      if (d | 0) ma(h, d, c[e >> 2] | 0) | 0;
      qa(h, a, 64) | 0
    }
    l = i;
    return
  }

  function Ta(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0;
    f = l;
    l = l + 80 | 0;
    e = f;
    if (!((a | 0) == 0 | (b | 0) == 0)) {
      d = Ea(a, c[a + 12 >> 2] | 0) | 0;
      if (!d) {
        Sa(e, b, c[a + 32 >> 2] | 0);
        Fa(e + 64 | 0, 8);
        Oa(e, a);
        Fa(e, 72);
        d = 0
      }
    } else d = -25;
    l = f;
    return d | 0
  }

  function Ua(b, c) {
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0;
    if ((b | 0) < 0) {
      a[c >> 0] = 45;
      d = c + 1 | 0;
      b = 0 - b | 0
    } else d = c;
    e = b;
    while (1) {
      d = d + 1 | 0;
      if ((e + 9 | 0) >>> 0 <= 18) break;
      else e = (e | 0) / 10 | 0
    }
    a[d >> 0] = 0;
    while (1) {
      d = d + -1 | 0;
      a[d >> 0] = a[2070 + ((b | 0) % 10 | 0) >> 0] | 0;
      if ((b + 9 | 0) >>> 0 <= 18) break;
      else b = (b | 0) / 10 | 0
    }
    return c | 0
  }

  function Va(b, d, e, f) {
    b = b | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    var g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0;
    n = l;
    l = l + 32 | 0;
    j = n;
    switch (f | 0) {
      case 1:
        {
          if (d >>> 0 < 12) f = -31;
          else {
            f = b;
            g = 2081;
            h = f + 12 | 0;
            do {
              a[f >> 0] = a[g >> 0] | 0;
              f = f + 1 | 0;
              g = g + 1 | 0
            } while ((f | 0) < (h | 0));
            g = 6
          }
          break
        }
      case 0:
        {
          if (d >>> 0 < 12) f = -31;
          else {
            f = b;
            g = 2093;
            h = f + 12 | 0;
            do {
              a[f >> 0] = a[g >> 0] | 0;
              f = f + 1 | 0;
              g = g + 1 | 0
            } while ((f | 0) < (h | 0));
            g = 6
          }
          break
        }
      default:
        f = -31
    }
    do
      if ((g | 0) == 6) {
        h = b + 11 | 0;
        f = d + -11 | 0;
        if (Na(e) | 0) {
          f = Na(e) | 0;
          break
        }
        Ua(c[e + 56 >> 2] | 0, j) | 0;
        g = kb(j) | 0;
        b = h + g | 0;
        d = f - g | 0;
        if (f >>> 0 <= g >>> 0) {
          f = -31;
          break
        }
        xb(h | 0, j | 0, g + 1 | 0) | 0;
        g = b + 3 | 0;
        h = d + -3 | 0;
        if (d >>> 0 >= 4) {
          a[b >> 0] = 36;
          a[b + 1 >> 0] = 109;
          a[b + 2 >> 0] = 61;
          a[b + 3 >> 0] = 0;
          Ua(c[e + 44 >> 2] | 0, j) | 0;
          f = kb(j) | 0;
          b = g + f | 0;
          d = h - f | 0;
          if (h >>> 0 <= f >>> 0) {
            f = -31;
            break
          }
          xb(g | 0, j | 0, f + 1 | 0) | 0;
          g = b + 3 | 0;
          h = d + -3 | 0;
          if (d >>> 0 >= 4) {
            a[b >> 0] = 44;
            a[b + 1 >> 0] = 116;
            a[b + 2 >> 0] = 61;
            a[b + 3 >> 0] = 0;
            Ua(c[e + 40 >> 2] | 0, j) | 0;
            f = kb(j) | 0;
            b = g + f | 0;
            d = h - f | 0;
            if (h >>> 0 <= f >>> 0) {
              f = -31;
              break
            }
            xb(g | 0, j | 0, f + 1 | 0) | 0;
            h = b + 3 | 0;
            i = d + -3 | 0;
            if (d >>> 0 >= 4) {
              a[b >> 0] = 44;
              a[b + 1 >> 0] = 112;
              a[b + 2 >> 0] = 61;
              a[b + 3 >> 0] = 0;
              Ua(c[e + 48 >> 2] | 0, j) | 0;
              g = kb(j) | 0;
              d = h + g | 0;
              f = i - g | 0;
              if (i >>> 0 <= g >>> 0) {
                f = -31;
                break
              }
              xb(h | 0, j | 0, g + 1 | 0) | 0;
              g = e + 36 | 0;
              if (c[g >> 2] | 0) {
                h = d + 6 | 0;
                b = f + -6 | 0;
                if (f >>> 0 < 7) {
                  f = -31;
                  break
                };
                a[d >> 0] = a[2063] | 0;
                a[d + 1 >> 0] = a[2064] | 0;
                a[d + 2 >> 0] = a[2065] | 0;
                a[d + 3 >> 0] = a[2066] | 0;
                a[d + 4 >> 0] = a[2067] | 0;
                a[d + 5 >> 0] = a[2068] | 0;
                a[d + 6 >> 0] = a[2069] | 0;
                f = Wa(h, b, c[e + 32 >> 2] | 0, c[g >> 2] | 0) | 0;
                g = (f | 0) == -1;
                if (g) {
                  f = -31;
                  break
                } else {
                  d = h + f | 0;
                  f = b - (g ? 0 : f) | 0
                }
              }
              g = e + 20 | 0;
              if (c[g >> 2] | 0) {
                h = d + 1 | 0;
                b = f + -1 | 0;
                if (f >>> 0 >= 2 ? (a[d >> 0] = 36, a[d + 1 >> 0] = 0, k = Wa(h, b, c[e + 16 >> 2] | 0, c[g >> 2] | 0) | 0, j = (k | 0) == -1, m = b - (j ? 0 : k) | 0, k = j ? h : h + k | 0, !j) : 0) {
                  f = e + 4 | 0;
                  if (c[f >> 2] | 0)
                    if (m >>> 0 < 2) f = -31;
                    else {
                      a[k >> 0] = 36;
                      a[k + 1 >> 0] = 0;
                      e = (Wa(k + 1 | 0, m + -1 | 0, c[e >> 2] | 0, c[f >> 2] | 0) | 0) != -1;
                      l = n;
                      return (e ? 0 : -31) | 0
                    } else f = 0
                } else f = -31
              } else f = 0
            } else f = -31
          } else f = -31
        } else f = -31
      }
    while (0);
    l = n;
    return f | 0
  }

  function Wa(b, c, e, f) {
    b = b | 0;
    c = c | 0;
    e = e | 0;
    f = f | 0;
    var g = 0,
      h = 0,
      i = 0,
      j = 0;
    g = ((f >>> 0) / 3 | 0) << 2;
    switch (((f >>> 0) % 3 | 0) & 3) {
      case 2:
        {
          g = g | 1;
          h = 3;
          break
        }
      case 1:
        {
          h = 3;
          break
        }
      default:
        { }
    }
    if ((h | 0) == 3) g = g + 2 | 0;
    if (g >>> 0 < c >>> 0) {
      if (f) {
        i = 0;
        c = 0;
        while (1) {
          i = d[e >> 0] | 0 | i << 8;
          c = c + 8 | 0;
          while (1) {
            j = c + -6 | 0;
            h = b + 1 | 0;
            a[b >> 0] = Xa(i >>> j & 63) | 0;
            if (j >>> 0 > 5) {
              b = h;
              c = j
            } else break
          }
          f = f + -1 | 0;
          if (!f) break;
          else {
            e = e + 1 | 0;
            b = h;
            c = j
          }
        }
        if (!j) b = h;
        else {
          a[h >> 0] = Xa(i << 12 - c & 63) | 0;
          b = b + 2 | 0
        }
      }
      a[b >> 0] = 0
    } else g = -1;
    return g | 0
  }

  function Xa(a) {
    a = a | 0;
    var b = 0,
      c = 0;
    c = (a + 65510 | 0) >>> 8 & 255;
    b = (a + 65484 | 0) >>> 8;
    return (0 - (a ^ 62) | 0) >>> 8 & 43 ^ 43 | c & a + 65 | (0 - (a ^ 63) | 0) >>> 8 & 47 ^ 47 | b & a + 71 & (c ^ 255) | (a + 65474 | 0) >>> 8 & a + 252 & (b & 255 ^ 255) | 0
  }

  function Ya(a, b, d) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
      u = 0,
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      A = 0,
      B = 0,
      C = 0,
      D = 0,
      E = 0,
      F = 0,
      G = 0,
      H = 0,
      I = 0,
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0,
      R = 0;
    g = l;
    l = l + 2048 | 0;
    e = g + 1024 | 0;
    f = g;
    Ca(e, b);
    Da(e, a);
    Ca(f, e);
    a = 0;
    do {
      B = a << 4;
      R = e + (B << 3) | 0;
      j = R;
      b = e + ((B | 4) << 3) | 0;
      i = b;
      H = c[i >> 2] | 0;
      i = c[i + 4 >> 2] | 0;
      j = Za(c[j >> 2] | 0, c[j + 4 >> 2] | 0, H, i) | 0;
      v = z;
      E = e + ((B | 12) << 3) | 0;
      y = E;
      y = _a(c[y >> 2] ^ j, c[y + 4 >> 2] ^ v, 32) | 0;
      G = z;
      n = e + ((B | 8) << 3) | 0;
      F = n;
      F = Za(c[F >> 2] | 0, c[F + 4 >> 2] | 0, y, G) | 0;
      K = z;
      i = _a(H ^ F, i ^ K, 24) | 0;
      H = z;
      v = Za(j, v, i, H) | 0;
      j = z;
      I = R;
      c[I >> 2] = v;
      c[I + 4 >> 2] = j;
      j = _a(y ^ v, G ^ j, 16) | 0;
      G = z;
      v = E;
      c[v >> 2] = j;
      c[v + 4 >> 2] = G;
      G = Za(F, K, j, G) | 0;
      j = z;
      K = n;
      c[K >> 2] = G;
      c[K + 4 >> 2] = j;
      j = _a(i ^ G, H ^ j, 63) | 0;
      H = b;
      c[H >> 2] = j;
      c[H + 4 >> 2] = z;
      H = e + ((B | 1) << 3) | 0;
      j = H;
      G = e + ((B | 5) << 3) | 0;
      i = G;
      K = c[i >> 2] | 0;
      i = c[i + 4 >> 2] | 0;
      j = Za(c[j >> 2] | 0, c[j + 4 >> 2] | 0, K, i) | 0;
      F = z;
      v = e + ((B | 13) << 3) | 0;
      y = v;
      y = _a(c[y >> 2] ^ j, c[y + 4 >> 2] ^ F, 32) | 0;
      I = z;
      m = e + ((B | 9) << 3) | 0;
      A = m;
      A = Za(c[A >> 2] | 0, c[A + 4 >> 2] | 0, y, I) | 0;
      x = z;
      i = _a(K ^ A, i ^ x, 24) | 0;
      K = z;
      F = Za(j, F, i, K) | 0;
      j = z;
      I = _a(y ^ F, I ^ j, 16) | 0;
      y = z;
      u = v;
      c[u >> 2] = I;
      c[u + 4 >> 2] = y;
      y = Za(A, x, I, y) | 0;
      I = z;
      x = m;
      c[x >> 2] = y;
      c[x + 4 >> 2] = I;
      I = _a(i ^ y, K ^ I, 63) | 0;
      K = z;
      y = e + ((B | 2) << 3) | 0;
      i = y;
      x = e + ((B | 6) << 3) | 0;
      A = x;
      u = c[A >> 2] | 0;
      A = c[A + 4 >> 2] | 0;
      i = Za(c[i >> 2] | 0, c[i + 4 >> 2] | 0, u, A) | 0;
      w = z;
      p = e + ((B | 14) << 3) | 0;
      M = p;
      M = _a(c[M >> 2] ^ i, c[M + 4 >> 2] ^ w, 32) | 0;
      N = z;
      L = e + ((B | 10) << 3) | 0;
      h = L;
      h = Za(c[h >> 2] | 0, c[h + 4 >> 2] | 0, M, N) | 0;
      s = z;
      A = _a(u ^ h, A ^ s, 24) | 0;
      u = z;
      w = Za(i, w, A, u) | 0;
      i = z;
      N = _a(M ^ w, N ^ i, 16) | 0;
      M = z;
      k = p;
      c[k >> 2] = N;
      c[k + 4 >> 2] = M;
      M = Za(h, s, N, M) | 0;
      N = z;
      u = _a(A ^ M, u ^ N, 63) | 0;
      A = z;
      s = e + ((B | 3) << 3) | 0;
      h = s;
      k = e + ((B | 7) << 3) | 0;
      o = k;
      r = c[o >> 2] | 0;
      o = c[o + 4 >> 2] | 0;
      h = Za(c[h >> 2] | 0, c[h + 4 >> 2] | 0, r, o) | 0;
      q = z;
      O = e + ((B | 15) << 3) | 0;
      Q = O;
      Q = _a(c[Q >> 2] ^ h, c[Q + 4 >> 2] ^ q, 32) | 0;
      J = z;
      B = e + ((B | 11) << 3) | 0;
      D = B;
      D = Za(c[D >> 2] | 0, c[D + 4 >> 2] | 0, Q, J) | 0;
      C = z;
      o = _a(r ^ D, o ^ C, 24) | 0;
      r = z;
      q = Za(h, q, o, r) | 0;
      h = z;
      J = _a(Q ^ q, J ^ h, 16) | 0;
      Q = z;
      C = Za(D, C, J, Q) | 0;
      D = z;
      r = _a(o ^ C, r ^ D, 63) | 0;
      o = z;
      t = R;
      t = Za(c[t >> 2] | 0, c[t + 4 >> 2] | 0, I, K) | 0;
      P = z;
      Q = _a(J ^ t, Q ^ P, 32) | 0;
      J = z;
      N = Za(M, N, Q, J) | 0;
      M = z;
      K = _a(I ^ N, K ^ M, 24) | 0;
      I = z;
      P = Za(t, P, K, I) | 0;
      t = z;
      c[R >> 2] = P;
      c[R + 4 >> 2] = t;
      t = _a(Q ^ P, J ^ t, 16) | 0;
      J = z;
      c[O >> 2] = t;
      c[O + 4 >> 2] = J;
      J = Za(N, M, t, J) | 0;
      t = z;
      c[L >> 2] = J;
      c[L + 4 >> 2] = t;
      t = _a(K ^ J, I ^ t, 63) | 0;
      c[G >> 2] = t;
      c[G + 4 >> 2] = z;
      j = Za(F, j, u, A) | 0;
      F = z;
      G = E;
      G = _a(c[G >> 2] ^ j, c[G + 4 >> 2] ^ F, 32) | 0;
      t = z;
      D = Za(C, D, G, t) | 0;
      C = z;
      A = _a(u ^ D, A ^ C, 24) | 0;
      u = z;
      F = Za(j, F, A, u) | 0;
      j = z;
      c[H >> 2] = F;
      c[H + 4 >> 2] = j;
      j = _a(G ^ F, t ^ j, 16) | 0;
      t = z;
      c[E >> 2] = j;
      c[E + 4 >> 2] = t;
      t = Za(D, C, j, t) | 0;
      j = z;
      c[B >> 2] = t;
      c[B + 4 >> 2] = j;
      j = _a(A ^ t, u ^ j, 63) | 0;
      c[x >> 2] = j;
      c[x + 4 >> 2] = z;
      i = Za(w, i, r, o) | 0;
      w = z;
      x = v;
      x = _a(c[x >> 2] ^ i, c[x + 4 >> 2] ^ w, 32) | 0;
      j = z;
      u = n;
      u = Za(c[u >> 2] | 0, c[u + 4 >> 2] | 0, x, j) | 0;
      t = z;
      o = _a(r ^ u, o ^ t, 24) | 0;
      r = z;
      w = Za(i, w, o, r) | 0;
      i = z;
      c[y >> 2] = w;
      c[y + 4 >> 2] = i;
      i = _a(x ^ w, j ^ i, 16) | 0;
      j = z;
      c[v >> 2] = i;
      c[v + 4 >> 2] = j;
      j = Za(u, t, i, j) | 0;
      i = z;
      c[n >> 2] = j;
      c[n + 4 >> 2] = i;
      i = _a(o ^ j, r ^ i, 63) | 0;
      c[k >> 2] = i;
      c[k + 4 >> 2] = z;
      k = b;
      i = c[k >> 2] | 0;
      k = c[k + 4 >> 2] | 0;
      h = Za(q, h, i, k) | 0;
      q = z;
      r = p;
      r = _a(c[r >> 2] ^ h, c[r + 4 >> 2] ^ q, 32) | 0;
      j = z;
      o = m;
      o = Za(c[o >> 2] | 0, c[o + 4 >> 2] | 0, r, j) | 0;
      n = z;
      k = _a(i ^ o, k ^ n, 24) | 0;
      i = z;
      q = Za(h, q, k, i) | 0;
      h = z;
      c[s >> 2] = q;
      c[s + 4 >> 2] = h;
      h = _a(r ^ q, j ^ h, 16) | 0;
      j = z;
      c[p >> 2] = h;
      c[p + 4 >> 2] = j;
      j = Za(o, n, h, j) | 0;
      h = z;
      c[m >> 2] = j;
      c[m + 4 >> 2] = h;
      h = _a(k ^ j, i ^ h, 63) | 0;
      c[b >> 2] = h;
      c[b + 4 >> 2] = z;
      a = a + 1 | 0
    } while ((a | 0) != 8);
    a = 0;
    do {
      x = a << 1;
      b = e + (x << 3) | 0;
      O = b;
      R = e + (x + 32 << 3) | 0;
      P = R;
      r = c[P >> 2] | 0;
      P = c[P + 4 >> 2] | 0;
      O = Za(c[O >> 2] | 0, c[O + 4 >> 2] | 0, r, P) | 0;
      D = z;
      u = e + (x + 96 << 3) | 0;
      A = u;
      A = _a(c[A >> 2] ^ O, c[A + 4 >> 2] ^ D, 32) | 0;
      s = z;
      L = e + (x + 64 << 3) | 0;
      t = L;
      t = Za(c[t >> 2] | 0, c[t + 4 >> 2] | 0, A, s) | 0;
      o = z;
      P = _a(r ^ t, P ^ o, 24) | 0;
      r = z;
      D = Za(O, D, P, r) | 0;
      O = z;
      q = b;
      c[q >> 2] = D;
      c[q + 4 >> 2] = O;
      O = _a(A ^ D, s ^ O, 16) | 0;
      s = z;
      D = u;
      c[D >> 2] = O;
      c[D + 4 >> 2] = s;
      s = Za(t, o, O, s) | 0;
      O = z;
      o = L;
      c[o >> 2] = s;
      c[o + 4 >> 2] = O;
      O = _a(P ^ s, r ^ O, 63) | 0;
      r = R;
      c[r >> 2] = O;
      c[r + 4 >> 2] = z;
      r = e + ((x | 1) << 3) | 0;
      O = r;
      s = e + (x + 33 << 3) | 0;
      P = s;
      o = c[P >> 2] | 0;
      P = c[P + 4 >> 2] | 0;
      O = Za(c[O >> 2] | 0, c[O + 4 >> 2] | 0, o, P) | 0;
      t = z;
      D = e + (x + 97 << 3) | 0;
      A = D;
      A = _a(c[A >> 2] ^ O, c[A + 4 >> 2] ^ t, 32) | 0;
      q = z;
      M = e + (x + 65 << 3) | 0;
      y = M;
      y = Za(c[y >> 2] | 0, c[y + 4 >> 2] | 0, A, q) | 0;
      B = z;
      P = _a(o ^ y, P ^ B, 24) | 0;
      o = z;
      t = Za(O, t, P, o) | 0;
      O = z;
      q = _a(A ^ t, q ^ O, 16) | 0;
      A = z;
      E = D;
      c[E >> 2] = q;
      c[E + 4 >> 2] = A;
      A = Za(y, B, q, A) | 0;
      q = z;
      B = M;
      c[B >> 2] = A;
      c[B + 4 >> 2] = q;
      q = _a(P ^ A, o ^ q, 63) | 0;
      o = z;
      A = e + (x + 16 << 3) | 0;
      P = A;
      B = e + (x + 48 << 3) | 0;
      y = B;
      E = c[y >> 2] | 0;
      y = c[y + 4 >> 2] | 0;
      P = Za(c[P >> 2] | 0, c[P + 4 >> 2] | 0, E, y) | 0;
      C = z;
      J = e + (x + 112 << 3) | 0;
      m = J;
      m = _a(c[m >> 2] ^ P, c[m + 4 >> 2] ^ C, 32) | 0;
      k = z;
      n = e + (x + 80 << 3) | 0;
      Q = n;
      Q = Za(c[Q >> 2] | 0, c[Q + 4 >> 2] | 0, m, k) | 0;
      G = z;
      y = _a(E ^ Q, y ^ G, 24) | 0;
      E = z;
      C = Za(P, C, y, E) | 0;
      P = z;
      k = _a(m ^ C, k ^ P, 16) | 0;
      m = z;
      N = J;
      c[N >> 2] = k;
      c[N + 4 >> 2] = m;
      m = Za(Q, G, k, m) | 0;
      k = z;
      E = _a(y ^ m, E ^ k, 63) | 0;
      y = z;
      G = e + (x + 17 << 3) | 0;
      Q = G;
      N = e + (x + 49 << 3) | 0;
      K = N;
      H = c[K >> 2] | 0;
      K = c[K + 4 >> 2] | 0;
      Q = Za(c[Q >> 2] | 0, c[Q + 4 >> 2] | 0, H, K) | 0;
      I = z;
      j = e + (x + 113 << 3) | 0;
      h = j;
      h = _a(c[h >> 2] ^ Q, c[h + 4 >> 2] ^ I, 32) | 0;
      p = z;
      x = e + (x + 81 << 3) | 0;
      v = x;
      v = Za(c[v >> 2] | 0, c[v + 4 >> 2] | 0, h, p) | 0;
      w = z;
      K = _a(H ^ v, K ^ w, 24) | 0;
      H = z;
      I = Za(Q, I, K, H) | 0;
      Q = z;
      p = _a(h ^ I, p ^ Q, 16) | 0;
      h = z;
      w = Za(v, w, p, h) | 0;
      v = z;
      H = _a(K ^ w, H ^ v, 63) | 0;
      K = z;
      F = b;
      F = Za(c[F >> 2] | 0, c[F + 4 >> 2] | 0, q, o) | 0;
      i = z;
      h = _a(p ^ F, h ^ i, 32) | 0;
      p = z;
      k = Za(m, k, h, p) | 0;
      m = z;
      o = _a(q ^ k, o ^ m, 24) | 0;
      q = z;
      i = Za(F, i, o, q) | 0;
      F = z;
      c[b >> 2] = i;
      c[b + 4 >> 2] = F;
      F = _a(h ^ i, p ^ F, 16) | 0;
      p = z;
      c[j >> 2] = F;
      c[j + 4 >> 2] = p;
      p = Za(k, m, F, p) | 0;
      F = z;
      c[n >> 2] = p;
      c[n + 4 >> 2] = F;
      F = _a(o ^ p, q ^ F, 63) | 0;
      c[s >> 2] = F;
      c[s + 4 >> 2] = z;
      O = Za(t, O, E, y) | 0;
      t = z;
      s = u;
      s = _a(c[s >> 2] ^ O, c[s + 4 >> 2] ^ t, 32) | 0;
      F = z;
      v = Za(w, v, s, F) | 0;
      w = z;
      y = _a(E ^ v, y ^ w, 24) | 0;
      E = z;
      t = Za(O, t, y, E) | 0;
      O = z;
      c[r >> 2] = t;
      c[r + 4 >> 2] = O;
      O = _a(s ^ t, F ^ O, 16) | 0;
      F = z;
      c[u >> 2] = O;
      c[u + 4 >> 2] = F;
      F = Za(v, w, O, F) | 0;
      O = z;
      c[x >> 2] = F;
      c[x + 4 >> 2] = O;
      O = _a(y ^ F, E ^ O, 63) | 0;
      c[B >> 2] = O;
      c[B + 4 >> 2] = z;
      P = Za(C, P, H, K) | 0;
      C = z;
      B = D;
      B = _a(c[B >> 2] ^ P, c[B + 4 >> 2] ^ C, 32) | 0;
      O = z;
      E = L;
      E = Za(c[E >> 2] | 0, c[E + 4 >> 2] | 0, B, O) | 0;
      F = z;
      K = _a(H ^ E, K ^ F, 24) | 0;
      H = z;
      C = Za(P, C, K, H) | 0;
      P = z;
      c[A >> 2] = C;
      c[A + 4 >> 2] = P;
      P = _a(B ^ C, O ^ P, 16) | 0;
      O = z;
      c[D >> 2] = P;
      c[D + 4 >> 2] = O;
      O = Za(E, F, P, O) | 0;
      P = z;
      c[L >> 2] = O;
      c[L + 4 >> 2] = P;
      P = _a(K ^ O, H ^ P, 63) | 0;
      c[N >> 2] = P;
      c[N + 4 >> 2] = z;
      N = R;
      P = c[N >> 2] | 0;
      N = c[N + 4 >> 2] | 0;
      Q = Za(I, Q, P, N) | 0;
      I = z;
      H = J;
      H = _a(c[H >> 2] ^ Q, c[H + 4 >> 2] ^ I, 32) | 0;
      O = z;
      K = M;
      K = Za(c[K >> 2] | 0, c[K + 4 >> 2] | 0, H, O) | 0;
      L = z;
      N = _a(P ^ K, N ^ L, 24) | 0;
      P = z;
      I = Za(Q, I, N, P) | 0;
      Q = z;
      c[G >> 2] = I;
      c[G + 4 >> 2] = Q;
      Q = _a(H ^ I, O ^ Q, 16) | 0;
      O = z;
      c[J >> 2] = Q;
      c[J + 4 >> 2] = O;
      O = Za(K, L, Q, O) | 0;
      Q = z;
      c[M >> 2] = O;
      c[M + 4 >> 2] = Q;
      Q = _a(N ^ O, P ^ Q, 63) | 0;
      c[R >> 2] = Q;
      c[R + 4 >> 2] = z;
      a = a + 1 | 0
    } while ((a | 0) != 8);
    Ca(d, f);
    Da(d, e);
    l = g;
    return
  }

  function Za(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      f = 0;
    f = ob(c | 0, d | 0, a | 0, b | 0) | 0;
    e = z;
    d = rb(a | 0, b | 0, 1) | 0;
    d = wb(d & -2 | 0, z & 1 | 0, c | 0, 0) | 0;
    d = ob(f | 0, e | 0, d | 0, z | 0) | 0;
    return d | 0
  }

  function _a(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    var d = 0,
      e = 0;
    d = qb(a | 0, b | 0, c | 0) | 0;
    e = z;
    c = rb(a | 0, b | 0, 64 - c | 0) | 0;
    z = z | e;
    return c | d | 0
  }

  function $a(a, b, d) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
      u = 0,
      v = 0,
      w = 0,
      x = 0,
      y = 0,
      A = 0,
      B = 0,
      C = 0,
      D = 0,
      E = 0,
      F = 0,
      G = 0,
      H = 0,
      I = 0,
      J = 0,
      K = 0,
      L = 0,
      M = 0,
      N = 0,
      O = 0,
      P = 0,
      Q = 0,
      R = 0;
    g = l;
    l = l + 2048 | 0;
    e = g + 1024 | 0;
    f = g;
    Ca(e, b);
    Da(e, a);
    Ca(f, e);
    Da(f, d);
    a = 0;
    do {
      B = a << 4;
      R = e + (B << 3) | 0;
      j = R;
      b = e + ((B | 4) << 3) | 0;
      i = b;
      H = c[i >> 2] | 0;
      i = c[i + 4 >> 2] | 0;
      j = Za(c[j >> 2] | 0, c[j + 4 >> 2] | 0, H, i) | 0;
      v = z;
      E = e + ((B | 12) << 3) | 0;
      y = E;
      y = _a(c[y >> 2] ^ j, c[y + 4 >> 2] ^ v, 32) | 0;
      G = z;
      n = e + ((B | 8) << 3) | 0;
      F = n;
      F = Za(c[F >> 2] | 0, c[F + 4 >> 2] | 0, y, G) | 0;
      K = z;
      i = _a(H ^ F, i ^ K, 24) | 0;
      H = z;
      v = Za(j, v, i, H) | 0;
      j = z;
      I = R;
      c[I >> 2] = v;
      c[I + 4 >> 2] = j;
      j = _a(y ^ v, G ^ j, 16) | 0;
      G = z;
      v = E;
      c[v >> 2] = j;
      c[v + 4 >> 2] = G;
      G = Za(F, K, j, G) | 0;
      j = z;
      K = n;
      c[K >> 2] = G;
      c[K + 4 >> 2] = j;
      j = _a(i ^ G, H ^ j, 63) | 0;
      H = b;
      c[H >> 2] = j;
      c[H + 4 >> 2] = z;
      H = e + ((B | 1) << 3) | 0;
      j = H;
      G = e + ((B | 5) << 3) | 0;
      i = G;
      K = c[i >> 2] | 0;
      i = c[i + 4 >> 2] | 0;
      j = Za(c[j >> 2] | 0, c[j + 4 >> 2] | 0, K, i) | 0;
      F = z;
      v = e + ((B | 13) << 3) | 0;
      y = v;
      y = _a(c[y >> 2] ^ j, c[y + 4 >> 2] ^ F, 32) | 0;
      I = z;
      m = e + ((B | 9) << 3) | 0;
      A = m;
      A = Za(c[A >> 2] | 0, c[A + 4 >> 2] | 0, y, I) | 0;
      x = z;
      i = _a(K ^ A, i ^ x, 24) | 0;
      K = z;
      F = Za(j, F, i, K) | 0;
      j = z;
      I = _a(y ^ F, I ^ j, 16) | 0;
      y = z;
      u = v;
      c[u >> 2] = I;
      c[u + 4 >> 2] = y;
      y = Za(A, x, I, y) | 0;
      I = z;
      x = m;
      c[x >> 2] = y;
      c[x + 4 >> 2] = I;
      I = _a(i ^ y, K ^ I, 63) | 0;
      K = z;
      y = e + ((B | 2) << 3) | 0;
      i = y;
      x = e + ((B | 6) << 3) | 0;
      A = x;
      u = c[A >> 2] | 0;
      A = c[A + 4 >> 2] | 0;
      i = Za(c[i >> 2] | 0, c[i + 4 >> 2] | 0, u, A) | 0;
      w = z;
      p = e + ((B | 14) << 3) | 0;
      M = p;
      M = _a(c[M >> 2] ^ i, c[M + 4 >> 2] ^ w, 32) | 0;
      N = z;
      L = e + ((B | 10) << 3) | 0;
      h = L;
      h = Za(c[h >> 2] | 0, c[h + 4 >> 2] | 0, M, N) | 0;
      s = z;
      A = _a(u ^ h, A ^ s, 24) | 0;
      u = z;
      w = Za(i, w, A, u) | 0;
      i = z;
      N = _a(M ^ w, N ^ i, 16) | 0;
      M = z;
      k = p;
      c[k >> 2] = N;
      c[k + 4 >> 2] = M;
      M = Za(h, s, N, M) | 0;
      N = z;
      u = _a(A ^ M, u ^ N, 63) | 0;
      A = z;
      s = e + ((B | 3) << 3) | 0;
      h = s;
      k = e + ((B | 7) << 3) | 0;
      o = k;
      r = c[o >> 2] | 0;
      o = c[o + 4 >> 2] | 0;
      h = Za(c[h >> 2] | 0, c[h + 4 >> 2] | 0, r, o) | 0;
      q = z;
      O = e + ((B | 15) << 3) | 0;
      Q = O;
      Q = _a(c[Q >> 2] ^ h, c[Q + 4 >> 2] ^ q, 32) | 0;
      J = z;
      B = e + ((B | 11) << 3) | 0;
      D = B;
      D = Za(c[D >> 2] | 0, c[D + 4 >> 2] | 0, Q, J) | 0;
      C = z;
      o = _a(r ^ D, o ^ C, 24) | 0;
      r = z;
      q = Za(h, q, o, r) | 0;
      h = z;
      J = _a(Q ^ q, J ^ h, 16) | 0;
      Q = z;
      C = Za(D, C, J, Q) | 0;
      D = z;
      r = _a(o ^ C, r ^ D, 63) | 0;
      o = z;
      t = R;
      t = Za(c[t >> 2] | 0, c[t + 4 >> 2] | 0, I, K) | 0;
      P = z;
      Q = _a(J ^ t, Q ^ P, 32) | 0;
      J = z;
      N = Za(M, N, Q, J) | 0;
      M = z;
      K = _a(I ^ N, K ^ M, 24) | 0;
      I = z;
      P = Za(t, P, K, I) | 0;
      t = z;
      c[R >> 2] = P;
      c[R + 4 >> 2] = t;
      t = _a(Q ^ P, J ^ t, 16) | 0;
      J = z;
      c[O >> 2] = t;
      c[O + 4 >> 2] = J;
      J = Za(N, M, t, J) | 0;
      t = z;
      c[L >> 2] = J;
      c[L + 4 >> 2] = t;
      t = _a(K ^ J, I ^ t, 63) | 0;
      c[G >> 2] = t;
      c[G + 4 >> 2] = z;
      j = Za(F, j, u, A) | 0;
      F = z;
      G = E;
      G = _a(c[G >> 2] ^ j, c[G + 4 >> 2] ^ F, 32) | 0;
      t = z;
      D = Za(C, D, G, t) | 0;
      C = z;
      A = _a(u ^ D, A ^ C, 24) | 0;
      u = z;
      F = Za(j, F, A, u) | 0;
      j = z;
      c[H >> 2] = F;
      c[H + 4 >> 2] = j;
      j = _a(G ^ F, t ^ j, 16) | 0;
      t = z;
      c[E >> 2] = j;
      c[E + 4 >> 2] = t;
      t = Za(D, C, j, t) | 0;
      j = z;
      c[B >> 2] = t;
      c[B + 4 >> 2] = j;
      j = _a(A ^ t, u ^ j, 63) | 0;
      c[x >> 2] = j;
      c[x + 4 >> 2] = z;
      i = Za(w, i, r, o) | 0;
      w = z;
      x = v;
      x = _a(c[x >> 2] ^ i, c[x + 4 >> 2] ^ w, 32) | 0;
      j = z;
      u = n;
      u = Za(c[u >> 2] | 0, c[u + 4 >> 2] | 0, x, j) | 0;
      t = z;
      o = _a(r ^ u, o ^ t, 24) | 0;
      r = z;
      w = Za(i, w, o, r) | 0;
      i = z;
      c[y >> 2] = w;
      c[y + 4 >> 2] = i;
      i = _a(x ^ w, j ^ i, 16) | 0;
      j = z;
      c[v >> 2] = i;
      c[v + 4 >> 2] = j;
      j = Za(u, t, i, j) | 0;
      i = z;
      c[n >> 2] = j;
      c[n + 4 >> 2] = i;
      i = _a(o ^ j, r ^ i, 63) | 0;
      c[k >> 2] = i;
      c[k + 4 >> 2] = z;
      k = b;
      i = c[k >> 2] | 0;
      k = c[k + 4 >> 2] | 0;
      h = Za(q, h, i, k) | 0;
      q = z;
      r = p;
      r = _a(c[r >> 2] ^ h, c[r + 4 >> 2] ^ q, 32) | 0;
      j = z;
      o = m;
      o = Za(c[o >> 2] | 0, c[o + 4 >> 2] | 0, r, j) | 0;
      n = z;
      k = _a(i ^ o, k ^ n, 24) | 0;
      i = z;
      q = Za(h, q, k, i) | 0;
      h = z;
      c[s >> 2] = q;
      c[s + 4 >> 2] = h;
      h = _a(r ^ q, j ^ h, 16) | 0;
      j = z;
      c[p >> 2] = h;
      c[p + 4 >> 2] = j;
      j = Za(o, n, h, j) | 0;
      h = z;
      c[m >> 2] = j;
      c[m + 4 >> 2] = h;
      h = _a(k ^ j, i ^ h, 63) | 0;
      c[b >> 2] = h;
      c[b + 4 >> 2] = z;
      a = a + 1 | 0
    } while ((a | 0) != 8);
    a = 0;
    do {
      x = a << 1;
      b = e + (x << 3) | 0;
      O = b;
      R = e + (x + 32 << 3) | 0;
      P = R;
      r = c[P >> 2] | 0;
      P = c[P + 4 >> 2] | 0;
      O = Za(c[O >> 2] | 0, c[O + 4 >> 2] | 0, r, P) | 0;
      D = z;
      u = e + (x + 96 << 3) | 0;
      A = u;
      A = _a(c[A >> 2] ^ O, c[A + 4 >> 2] ^ D, 32) | 0;
      s = z;
      L = e + (x + 64 << 3) | 0;
      t = L;
      t = Za(c[t >> 2] | 0, c[t + 4 >> 2] | 0, A, s) | 0;
      o = z;
      P = _a(r ^ t, P ^ o, 24) | 0;
      r = z;
      D = Za(O, D, P, r) | 0;
      O = z;
      q = b;
      c[q >> 2] = D;
      c[q + 4 >> 2] = O;
      O = _a(A ^ D, s ^ O, 16) | 0;
      s = z;
      D = u;
      c[D >> 2] = O;
      c[D + 4 >> 2] = s;
      s = Za(t, o, O, s) | 0;
      O = z;
      o = L;
      c[o >> 2] = s;
      c[o + 4 >> 2] = O;
      O = _a(P ^ s, r ^ O, 63) | 0;
      r = R;
      c[r >> 2] = O;
      c[r + 4 >> 2] = z;
      r = e + ((x | 1) << 3) | 0;
      O = r;
      s = e + (x + 33 << 3) | 0;
      P = s;
      o = c[P >> 2] | 0;
      P = c[P + 4 >> 2] | 0;
      O = Za(c[O >> 2] | 0, c[O + 4 >> 2] | 0, o, P) | 0;
      t = z;
      D = e + (x + 97 << 3) | 0;
      A = D;
      A = _a(c[A >> 2] ^ O, c[A + 4 >> 2] ^ t, 32) | 0;
      q = z;
      M = e + (x + 65 << 3) | 0;
      y = M;
      y = Za(c[y >> 2] | 0, c[y + 4 >> 2] | 0, A, q) | 0;
      B = z;
      P = _a(o ^ y, P ^ B, 24) | 0;
      o = z;
      t = Za(O, t, P, o) | 0;
      O = z;
      q = _a(A ^ t, q ^ O, 16) | 0;
      A = z;
      E = D;
      c[E >> 2] = q;
      c[E + 4 >> 2] = A;
      A = Za(y, B, q, A) | 0;
      q = z;
      B = M;
      c[B >> 2] = A;
      c[B + 4 >> 2] = q;
      q = _a(P ^ A, o ^ q, 63) | 0;
      o = z;
      A = e + (x + 16 << 3) | 0;
      P = A;
      B = e + (x + 48 << 3) | 0;
      y = B;
      E = c[y >> 2] | 0;
      y = c[y + 4 >> 2] | 0;
      P = Za(c[P >> 2] | 0, c[P + 4 >> 2] | 0, E, y) | 0;
      C = z;
      J = e + (x + 112 << 3) | 0;
      m = J;
      m = _a(c[m >> 2] ^ P, c[m + 4 >> 2] ^ C, 32) | 0;
      k = z;
      n = e + (x + 80 << 3) | 0;
      Q = n;
      Q = Za(c[Q >> 2] | 0, c[Q + 4 >> 2] | 0, m, k) | 0;
      G = z;
      y = _a(E ^ Q, y ^ G, 24) | 0;
      E = z;
      C = Za(P, C, y, E) | 0;
      P = z;
      k = _a(m ^ C, k ^ P, 16) | 0;
      m = z;
      N = J;
      c[N >> 2] = k;
      c[N + 4 >> 2] = m;
      m = Za(Q, G, k, m) | 0;
      k = z;
      E = _a(y ^ m, E ^ k, 63) | 0;
      y = z;
      G = e + (x + 17 << 3) | 0;
      Q = G;
      N = e + (x + 49 << 3) | 0;
      K = N;
      H = c[K >> 2] | 0;
      K = c[K + 4 >> 2] | 0;
      Q = Za(c[Q >> 2] | 0, c[Q + 4 >> 2] | 0, H, K) | 0;
      I = z;
      j = e + (x + 113 << 3) | 0;
      h = j;
      h = _a(c[h >> 2] ^ Q, c[h + 4 >> 2] ^ I, 32) | 0;
      p = z;
      x = e + (x + 81 << 3) | 0;
      v = x;
      v = Za(c[v >> 2] | 0, c[v + 4 >> 2] | 0, h, p) | 0;
      w = z;
      K = _a(H ^ v, K ^ w, 24) | 0;
      H = z;
      I = Za(Q, I, K, H) | 0;
      Q = z;
      p = _a(h ^ I, p ^ Q, 16) | 0;
      h = z;
      w = Za(v, w, p, h) | 0;
      v = z;
      H = _a(K ^ w, H ^ v, 63) | 0;
      K = z;
      F = b;
      F = Za(c[F >> 2] | 0, c[F + 4 >> 2] | 0, q, o) | 0;
      i = z;
      h = _a(p ^ F, h ^ i, 32) | 0;
      p = z;
      k = Za(m, k, h, p) | 0;
      m = z;
      o = _a(q ^ k, o ^ m, 24) | 0;
      q = z;
      i = Za(F, i, o, q) | 0;
      F = z;
      c[b >> 2] = i;
      c[b + 4 >> 2] = F;
      F = _a(h ^ i, p ^ F, 16) | 0;
      p = z;
      c[j >> 2] = F;
      c[j + 4 >> 2] = p;
      p = Za(k, m, F, p) | 0;
      F = z;
      c[n >> 2] = p;
      c[n + 4 >> 2] = F;
      F = _a(o ^ p, q ^ F, 63) | 0;
      c[s >> 2] = F;
      c[s + 4 >> 2] = z;
      O = Za(t, O, E, y) | 0;
      t = z;
      s = u;
      s = _a(c[s >> 2] ^ O, c[s + 4 >> 2] ^ t, 32) | 0;
      F = z;
      v = Za(w, v, s, F) | 0;
      w = z;
      y = _a(E ^ v, y ^ w, 24) | 0;
      E = z;
      t = Za(O, t, y, E) | 0;
      O = z;
      c[r >> 2] = t;
      c[r + 4 >> 2] = O;
      O = _a(s ^ t, F ^ O, 16) | 0;
      F = z;
      c[u >> 2] = O;
      c[u + 4 >> 2] = F;
      F = Za(v, w, O, F) | 0;
      O = z;
      c[x >> 2] = F;
      c[x + 4 >> 2] = O;
      O = _a(y ^ F, E ^ O, 63) | 0;
      c[B >> 2] = O;
      c[B + 4 >> 2] = z;
      P = Za(C, P, H, K) | 0;
      C = z;
      B = D;
      B = _a(c[B >> 2] ^ P, c[B + 4 >> 2] ^ C, 32) | 0;
      O = z;
      E = L;
      E = Za(c[E >> 2] | 0, c[E + 4 >> 2] | 0, B, O) | 0;
      F = z;
      K = _a(H ^ E, K ^ F, 24) | 0;
      H = z;
      C = Za(P, C, K, H) | 0;
      P = z;
      c[A >> 2] = C;
      c[A + 4 >> 2] = P;
      P = _a(B ^ C, O ^ P, 16) | 0;
      O = z;
      c[D >> 2] = P;
      c[D + 4 >> 2] = O;
      O = Za(E, F, P, O) | 0;
      P = z;
      c[L >> 2] = O;
      c[L + 4 >> 2] = P;
      P = _a(K ^ O, H ^ P, 63) | 0;
      c[N >> 2] = P;
      c[N + 4 >> 2] = z;
      N = R;
      P = c[N >> 2] | 0;
      N = c[N + 4 >> 2] | 0;
      Q = Za(I, Q, P, N) | 0;
      I = z;
      H = J;
      H = _a(c[H >> 2] ^ Q, c[H + 4 >> 2] ^ I, 32) | 0;
      O = z;
      K = M;
      K = Za(c[K >> 2] | 0, c[K + 4 >> 2] | 0, H, O) | 0;
      L = z;
      N = _a(P ^ K, N ^ L, 24) | 0;
      P = z;
      I = Za(Q, I, N, P) | 0;
      Q = z;
      c[G >> 2] = I;
      c[G + 4 >> 2] = Q;
      Q = _a(H ^ I, O ^ Q, 16) | 0;
      O = z;
      c[J >> 2] = Q;
      c[J + 4 >> 2] = O;
      O = Za(K, L, Q, O) | 0;
      Q = z;
      c[M >> 2] = O;
      c[M + 4 >> 2] = Q;
      Q = _a(N ^ O, P ^ Q, 63) | 0;
      c[R >> 2] = Q;
      c[R + 4 >> 2] = z;
      a = a + 1 | 0
    } while ((a | 0) != 8);
    Ca(d, f);
    Da(d, e);
    l = g;
    return
  }

  function ab(a, b, e) {
    a = a | 0;
    b = b | 0;
    e = e | 0;
    var f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0;
    o = l;
    l = l + 4096 | 0;
    i = o + 3072 | 0;
    j = o + 2048 | 0;
    k = o + 1024 | 0;
    n = o;
    Ba(i, 0);
    Ba(j, 0);
    if ((a | 0) != 0 & (b | 0) != 0 ? (m = j, c[m >> 2] = c[b >> 2], c[m + 4 >> 2] = 0, m = j + 8 | 0, c[m >> 2] = c[b + 4 >> 2], c[m + 4 >> 2] = 0, m = j + 16 | 0, c[m >> 2] = d[b + 8 >> 0], c[m + 4 >> 2] = 0, m = j + 24 | 0, c[m >> 2] = c[a + 12 >> 2], c[m + 4 >> 2] = 0, m = j + 32 | 0, c[m >> 2] = c[a + 8 >> 2], c[m + 4 >> 2] = 0, m = j + 40 | 0, c[m >> 2] = c[a + 32 >> 2], c[m + 4 >> 2] = 0, m = a + 16 | 0, f = c[m >> 2] | 0, f | 0) : 0) {
      h = j + 48 | 0;
      g = 0;
      a = f;
      do {
        b = g & 127;
        if (!b) {
          f = h;
          f = ob(c[f >> 2] | 0, c[f + 4 >> 2] | 0, 1, 0) | 0;
          a = h;
          c[a >> 2] = f;
          c[a + 4 >> 2] = z;
          Ba(n, 0);
          Ba(k, 0);
          $a(i, j, n);
          $a(i, n, k);
          a = c[m >> 2] | 0
        }
        p = k + (b << 3) | 0;
        b = c[p + 4 >> 2] | 0;
        f = e + (g << 3) | 0;
        c[f >> 2] = c[p >> 2];
        c[f + 4 >> 2] = b;
        g = g + 1 | 0
      } while (g >>> 0 < a >>> 0)
    }
    l = o;
    return
  }

  function bb(b, d) {
    b = b | 0;
    d = d | 0;
    var e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0;
    if (b | 0 ? (r = (c[b + 32 >> 2] | 0) == 1, s = b + 16 | 0, e = c[s >> 2] | 0, t = db(e << 3) | 0, t | 0) : 0) {
      if (r) {
        ab(b, d, t);
        e = c[s >> 2] | 0
      }
      o = d + 8 | 0;
      h = a[o >> 0] | 0;
      g = (c[d >> 2] | 0) == 0 & h << 24 >> 24 == 0 ? 2 : 0;
      p = d + 4 | 0;
      q = b + 20 | 0;
      f = c[q >> 2] | 0;
      h = g + (O(f, c[p >> 2] | 0) | 0) + (O(e, h & 255) | 0) | 0;
      a: do
        if (g >>> 0 < e >>> 0) {
          l = b + 24 | 0;
          m = d + 12 | 0;
          n = b + 4 | 0;
          k = h;
          e = g;
          g = (((h >>> 0) % (f >>> 0) | 0 | 0) == 0 ? f + -1 | 0 : -1) + h | 0;
          while (1) {
            j = ((k >>> 0) % (f >>> 0) | 0 | 0) == 1 ? k + -1 | 0 : g;
            if (r) f = t + (e << 3) | 0;
            else f = (c[b >> 2] | 0) + (j << 10) | 0;
            h = c[f >> 2] | 0;
            f = ub(c[f + 4 >> 2] | 0, 0, c[l >> 2] | 0, 0) | 0;
            g = z;
            if ((c[d >> 2] | 0) == 0 ? (a[o >> 0] | 0) == 0 : 0) {
              f = c[p >> 2] | 0;
              g = 0
            }
            c[m >> 2] = e;
            h = La(b, d, h, ((g | 0) == 0 ? (f | 0) == (c[p >> 2] | 0) : 0) & 1) | 0;
            i = c[b >> 2] | 0;
            g = wb(c[q >> 2] | 0, 0, f | 0, g | 0) | 0;
            g = i + (g << 10) + (h << 10) | 0;
            h = i + (k << 10) | 0;
            do
              if ((c[n >> 2] | 0) != 16) {
                f = i + (j << 10) | 0;
                if (!(c[d >> 2] | 0)) {
                  Ya(f, g, h);
                  break
                } else {
                  $a(f, g, h);
                  break
                }
              } else Ya(i + (j << 10) | 0, g, h);
            while (0);
            e = e + 1 | 0;
            if (e >>> 0 >= (c[s >> 2] | 0) >>> 0) break a;
            k = k + 1 | 0;
            g = j + 1 | 0;
            f = c[q >> 2] | 0
          }
        }
      while (0);
      eb(t)
    }
    return
  }

  function cb(a) {
    a = a | 0;
    return X(a | 0, 0) | 0
  }

  function db(a) {
    a = a | 0;
    var b = 0,
      d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0,
      q = 0,
      r = 0,
      s = 0,
      t = 0,
      u = 0,
      v = 0,
      w = 0,
      x = 0;
    x = l;
    l = l + 16 | 0;
    o = x;
    do
      if (a >>> 0 < 245) {
        k = a >>> 0 < 11 ? 16 : a + 11 & -8;
        a = k >>> 3;
        n = c[528] | 0;
        d = n >>> a;
        if (d & 3 | 0) {
          b = (d & 1 ^ 1) + a | 0;
          a = 2152 + (b << 1 << 2) | 0;
          d = a + 8 | 0;
          e = c[d >> 2] | 0;
          f = e + 8 | 0;
          g = c[f >> 2] | 0;
          if ((a | 0) == (g | 0)) c[528] = n & ~(1 << b);
          else {
            c[g + 12 >> 2] = a;
            c[d >> 2] = g
          }
          w = b << 3;
          c[e + 4 >> 2] = w | 3;
          w = e + w + 4 | 0;
          c[w >> 2] = c[w >> 2] | 1;
          w = f;
          l = x;
          return w | 0
        }
        m = c[530] | 0;
        if (k >>> 0 > m >>> 0) {
          if (d | 0) {
            b = 2 << a;
            b = d << a & (b | 0 - b);
            b = (b & 0 - b) + -1 | 0;
            h = b >>> 12 & 16;
            b = b >>> h;
            d = b >>> 5 & 8;
            b = b >>> d;
            f = b >>> 2 & 4;
            b = b >>> f;
            a = b >>> 1 & 2;
            b = b >>> a;
            e = b >>> 1 & 1;
            e = (d | h | f | a | e) + (b >>> e) | 0;
            b = 2152 + (e << 1 << 2) | 0;
            a = b + 8 | 0;
            f = c[a >> 2] | 0;
            h = f + 8 | 0;
            d = c[h >> 2] | 0;
            if ((b | 0) == (d | 0)) {
              a = n & ~(1 << e);
              c[528] = a
            } else {
              c[d + 12 >> 2] = b;
              c[a >> 2] = d;
              a = n
            }
            g = (e << 3) - k | 0;
            c[f + 4 >> 2] = k | 3;
            e = f + k | 0;
            c[e + 4 >> 2] = g | 1;
            c[e + g >> 2] = g;
            if (m | 0) {
              f = c[533] | 0;
              b = m >>> 3;
              d = 2152 + (b << 1 << 2) | 0;
              b = 1 << b;
              if (!(a & b)) {
                c[528] = a | b;
                b = d;
                a = d + 8 | 0
              } else {
                a = d + 8 | 0;
                b = c[a >> 2] | 0
              }
              c[a >> 2] = f;
              c[b + 12 >> 2] = f;
              c[f + 8 >> 2] = b;
              c[f + 12 >> 2] = d
            }
            c[530] = g;
            c[533] = e;
            w = h;
            l = x;
            return w | 0
          }
          i = c[529] | 0;
          if (i) {
            d = (i & 0 - i) + -1 | 0;
            h = d >>> 12 & 16;
            d = d >>> h;
            g = d >>> 5 & 8;
            d = d >>> g;
            j = d >>> 2 & 4;
            d = d >>> j;
            e = d >>> 1 & 2;
            d = d >>> e;
            a = d >>> 1 & 1;
            a = c[2416 + ((g | h | j | e | a) + (d >>> a) << 2) >> 2] | 0;
            d = (c[a + 4 >> 2] & -8) - k | 0;
            e = c[a + 16 + (((c[a + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
            if (!e) {
              j = a;
              g = d
            } else {
              do {
                h = (c[e + 4 >> 2] & -8) - k | 0;
                j = h >>> 0 < d >>> 0;
                d = j ? h : d;
                a = j ? e : a;
                e = c[e + 16 + (((c[e + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0
              } while ((e | 0) != 0);
              j = a;
              g = d
            }
            h = j + k | 0;
            if (j >>> 0 < h >>> 0) {
              f = c[j + 24 >> 2] | 0;
              b = c[j + 12 >> 2] | 0;
              do
                if ((b | 0) == (j | 0)) {
                  a = j + 20 | 0;
                  b = c[a >> 2] | 0;
                  if (!b) {
                    a = j + 16 | 0;
                    b = c[a >> 2] | 0;
                    if (!b) {
                      d = 0;
                      break
                    }
                  }
                  while (1) {
                    d = b + 20 | 0;
                    e = c[d >> 2] | 0;
                    if (e | 0) {
                      b = e;
                      a = d;
                      continue
                    }
                    d = b + 16 | 0;
                    e = c[d >> 2] | 0;
                    if (!e) break;
                    else {
                      b = e;
                      a = d
                    }
                  }
                  c[a >> 2] = 0;
                  d = b
                } else {
                  d = c[j + 8 >> 2] | 0;
                  c[d + 12 >> 2] = b;
                  c[b + 8 >> 2] = d;
                  d = b
                }
              while (0);
              do
                if (f | 0) {
                  b = c[j + 28 >> 2] | 0;
                  a = 2416 + (b << 2) | 0;
                  if ((j | 0) == (c[a >> 2] | 0)) {
                    c[a >> 2] = d;
                    if (!d) {
                      c[529] = i & ~(1 << b);
                      break
                    }
                  } else {
                    c[f + 16 + (((c[f + 16 >> 2] | 0) != (j | 0) & 1) << 2) >> 2] = d;
                    if (!d) break
                  }
                  c[d + 24 >> 2] = f;
                  b = c[j + 16 >> 2] | 0;
                  if (b | 0) {
                    c[d + 16 >> 2] = b;
                    c[b + 24 >> 2] = d
                  }
                  b = c[j + 20 >> 2] | 0;
                  if (b | 0) {
                    c[d + 20 >> 2] = b;
                    c[b + 24 >> 2] = d
                  }
                }
              while (0);
              if (g >>> 0 < 16) {
                w = g + k | 0;
                c[j + 4 >> 2] = w | 3;
                w = j + w + 4 | 0;
                c[w >> 2] = c[w >> 2] | 1
              } else {
                c[j + 4 >> 2] = k | 3;
                c[h + 4 >> 2] = g | 1;
                c[h + g >> 2] = g;
                if (m | 0) {
                  e = c[533] | 0;
                  b = m >>> 3;
                  d = 2152 + (b << 1 << 2) | 0;
                  b = 1 << b;
                  if (!(n & b)) {
                    c[528] = n | b;
                    b = d;
                    a = d + 8 | 0
                  } else {
                    a = d + 8 | 0;
                    b = c[a >> 2] | 0
                  }
                  c[a >> 2] = e;
                  c[b + 12 >> 2] = e;
                  c[e + 8 >> 2] = b;
                  c[e + 12 >> 2] = d
                }
                c[530] = g;
                c[533] = h
              }
              w = j + 8 | 0;
              l = x;
              return w | 0
            } else n = k
          } else n = k
        } else n = k
      } else if (a >>> 0 <= 4294967231) {
        a = a + 11 | 0;
        k = a & -8;
        j = c[529] | 0;
        if (j) {
          e = 0 - k | 0;
          a = a >>> 8;
          if (a)
            if (k >>> 0 > 16777215) i = 31;
            else {
              n = (a + 1048320 | 0) >>> 16 & 8;
              v = a << n;
              m = (v + 520192 | 0) >>> 16 & 4;
              v = v << m;
              i = (v + 245760 | 0) >>> 16 & 2;
              i = 14 - (m | n | i) + (v << i >>> 15) | 0;
              i = k >>> (i + 7 | 0) & 1 | i << 1
            } else i = 0;
          d = c[2416 + (i << 2) >> 2] | 0;
          a: do
            if (!d) {
              d = 0;
              a = 0;
              v = 57
            } else {
              a = 0;
              h = k << ((i | 0) == 31 ? 0 : 25 - (i >>> 1) | 0);
              g = 0;
              while (1) {
                f = (c[d + 4 >> 2] & -8) - k | 0;
                if (f >>> 0 < e >>> 0)
                  if (!f) {
                    a = d;
                    e = 0;
                    f = d;
                    v = 61;
                    break a
                  } else {
                    a = d;
                    e = f
                  }
                f = c[d + 20 >> 2] | 0;
                d = c[d + 16 + (h >>> 31 << 2) >> 2] | 0;
                g = (f | 0) == 0 | (f | 0) == (d | 0) ? g : f;
                f = (d | 0) == 0;
                if (f) {
                  d = g;
                  v = 57;
                  break
                } else h = h << ((f ^ 1) & 1)
              }
            }
          while (0);
          if ((v | 0) == 57) {
            if ((d | 0) == 0 & (a | 0) == 0) {
              a = 2 << i;
              a = j & (a | 0 - a);
              if (!a) {
                n = k;
                break
              }
              n = (a & 0 - a) + -1 | 0;
              h = n >>> 12 & 16;
              n = n >>> h;
              g = n >>> 5 & 8;
              n = n >>> g;
              i = n >>> 2 & 4;
              n = n >>> i;
              m = n >>> 1 & 2;
              n = n >>> m;
              d = n >>> 1 & 1;
              a = 0;
              d = c[2416 + ((g | h | i | m | d) + (n >>> d) << 2) >> 2] | 0
            }
            if (!d) {
              i = a;
              h = e
            } else {
              f = d;
              v = 61
            }
          }
          if ((v | 0) == 61)
            while (1) {
              v = 0;
              d = (c[f + 4 >> 2] & -8) - k | 0;
              n = d >>> 0 < e >>> 0;
              d = n ? d : e;
              a = n ? f : a;
              f = c[f + 16 + (((c[f + 16 >> 2] | 0) == 0 & 1) << 2) >> 2] | 0;
              if (!f) {
                i = a;
                h = d;
                break
              } else {
                e = d;
                v = 61
              }
            }
          if ((i | 0) != 0 ? h >>> 0 < ((c[530] | 0) - k | 0) >>> 0 : 0) {
            g = i + k | 0;
            if (i >>> 0 >= g >>> 0) {
              w = 0;
              l = x;
              return w | 0
            }
            f = c[i + 24 >> 2] | 0;
            b = c[i + 12 >> 2] | 0;
            do
              if ((b | 0) == (i | 0)) {
                a = i + 20 | 0;
                b = c[a >> 2] | 0;
                if (!b) {
                  a = i + 16 | 0;
                  b = c[a >> 2] | 0;
                  if (!b) {
                    b = 0;
                    break
                  }
                }
                while (1) {
                  d = b + 20 | 0;
                  e = c[d >> 2] | 0;
                  if (e | 0) {
                    b = e;
                    a = d;
                    continue
                  }
                  d = b + 16 | 0;
                  e = c[d >> 2] | 0;
                  if (!e) break;
                  else {
                    b = e;
                    a = d
                  }
                }
                c[a >> 2] = 0
              } else {
                w = c[i + 8 >> 2] | 0;
                c[w + 12 >> 2] = b;
                c[b + 8 >> 2] = w
              }
            while (0);
            do
              if (f) {
                a = c[i + 28 >> 2] | 0;
                d = 2416 + (a << 2) | 0;
                if ((i | 0) == (c[d >> 2] | 0)) {
                  c[d >> 2] = b;
                  if (!b) {
                    e = j & ~(1 << a);
                    c[529] = e;
                    break
                  }
                } else {
                  c[f + 16 + (((c[f + 16 >> 2] | 0) != (i | 0) & 1) << 2) >> 2] = b;
                  if (!b) {
                    e = j;
                    break
                  }
                }
                c[b + 24 >> 2] = f;
                a = c[i + 16 >> 2] | 0;
                if (a | 0) {
                  c[b + 16 >> 2] = a;
                  c[a + 24 >> 2] = b
                }
                a = c[i + 20 >> 2] | 0;
                if (a) {
                  c[b + 20 >> 2] = a;
                  c[a + 24 >> 2] = b;
                  e = j
                } else e = j
              } else e = j;
            while (0);
            do
              if (h >>> 0 >= 16) {
                c[i + 4 >> 2] = k | 3;
                c[g + 4 >> 2] = h | 1;
                c[g + h >> 2] = h;
                b = h >>> 3;
                if (h >>> 0 < 256) {
                  d = 2152 + (b << 1 << 2) | 0;
                  a = c[528] | 0;
                  b = 1 << b;
                  if (!(a & b)) {
                    c[528] = a | b;
                    b = d;
                    a = d + 8 | 0
                  } else {
                    a = d + 8 | 0;
                    b = c[a >> 2] | 0
                  }
                  c[a >> 2] = g;
                  c[b + 12 >> 2] = g;
                  c[g + 8 >> 2] = b;
                  c[g + 12 >> 2] = d;
                  break
                }
                b = h >>> 8;
                if (b)
                  if (h >>> 0 > 16777215) b = 31;
                  else {
                    v = (b + 1048320 | 0) >>> 16 & 8;
                    w = b << v;
                    u = (w + 520192 | 0) >>> 16 & 4;
                    w = w << u;
                    b = (w + 245760 | 0) >>> 16 & 2;
                    b = 14 - (u | v | b) + (w << b >>> 15) | 0;
                    b = h >>> (b + 7 | 0) & 1 | b << 1
                  } else b = 0;
                d = 2416 + (b << 2) | 0;
                c[g + 28 >> 2] = b;
                a = g + 16 | 0;
                c[a + 4 >> 2] = 0;
                c[a >> 2] = 0;
                a = 1 << b;
                if (!(e & a)) {
                  c[529] = e | a;
                  c[d >> 2] = g;
                  c[g + 24 >> 2] = d;
                  c[g + 12 >> 2] = g;
                  c[g + 8 >> 2] = g;
                  break
                }
                a = h << ((b | 0) == 31 ? 0 : 25 - (b >>> 1) | 0);
                d = c[d >> 2] | 0;
                while (1) {
                  if ((c[d + 4 >> 2] & -8 | 0) == (h | 0)) {
                    v = 97;
                    break
                  }
                  e = d + 16 + (a >>> 31 << 2) | 0;
                  b = c[e >> 2] | 0;
                  if (!b) {
                    v = 96;
                    break
                  } else {
                    a = a << 1;
                    d = b
                  }
                }
                if ((v | 0) == 96) {
                  c[e >> 2] = g;
                  c[g + 24 >> 2] = d;
                  c[g + 12 >> 2] = g;
                  c[g + 8 >> 2] = g;
                  break
                } else if ((v | 0) == 97) {
                  v = d + 8 | 0;
                  w = c[v >> 2] | 0;
                  c[w + 12 >> 2] = g;
                  c[v >> 2] = g;
                  c[g + 8 >> 2] = w;
                  c[g + 12 >> 2] = d;
                  c[g + 24 >> 2] = 0;
                  break
                }
              } else {
                w = h + k | 0;
                c[i + 4 >> 2] = w | 3;
                w = i + w + 4 | 0;
                c[w >> 2] = c[w >> 2] | 1
              }
            while (0);
            w = i + 8 | 0;
            l = x;
            return w | 0
          } else n = k
        } else n = k
      } else n = -1;
    while (0);
    d = c[530] | 0;
    if (d >>> 0 >= n >>> 0) {
      b = d - n | 0;
      a = c[533] | 0;
      if (b >>> 0 > 15) {
        w = a + n | 0;
        c[533] = w;
        c[530] = b;
        c[w + 4 >> 2] = b | 1;
        c[w + b >> 2] = b;
        c[a + 4 >> 2] = n | 3
      } else {
        c[530] = 0;
        c[533] = 0;
        c[a + 4 >> 2] = d | 3;
        w = a + d + 4 | 0;
        c[w >> 2] = c[w >> 2] | 1
      }
      w = a + 8 | 0;
      l = x;
      return w | 0
    }
    h = c[531] | 0;
    if (h >>> 0 > n >>> 0) {
      u = h - n | 0;
      c[531] = u;
      w = c[534] | 0;
      v = w + n | 0;
      c[534] = v;
      c[v + 4 >> 2] = u | 1;
      c[w + 4 >> 2] = n | 3;
      w = w + 8 | 0;
      l = x;
      return w | 0
    }
    if (!(c[646] | 0)) {
      c[648] = 4096;
      c[647] = 4096;
      c[649] = -1;
      c[650] = -1;
      c[651] = 0;
      c[639] = 0;
      a = o & -16 ^ 1431655768;
      c[o >> 2] = a;
      c[646] = a;
      a = 4096
    } else a = c[648] | 0;
    i = n + 48 | 0;
    j = n + 47 | 0;
    g = a + j | 0;
    f = 0 - a | 0;
    k = g & f;
    if (k >>> 0 <= n >>> 0) {
      w = 0;
      l = x;
      return w | 0
    }
    a = c[638] | 0;
    if (a | 0 ? (m = c[636] | 0, o = m + k | 0, o >>> 0 <= m >>> 0 | o >>> 0 > a >>> 0) : 0) {
      w = 0;
      l = x;
      return w | 0
    }
    b: do
      if (!(c[639] & 4)) {
        d = c[534] | 0;
        c: do
          if (d) {
            e = 2560;
            while (1) {
              a = c[e >> 2] | 0;
              if (a >>> 0 <= d >>> 0 ? (r = e + 4 | 0, (a + (c[r >> 2] | 0) | 0) >>> 0 > d >>> 0) : 0) break;
              a = c[e + 8 >> 2] | 0;
              if (!a) {
                v = 118;
                break c
              } else e = a
            }
            b = g - h & f;
            if (b >>> 0 < 2147483647) {
              a = nb(b | 0) | 0;
              if ((a | 0) == ((c[e >> 2] | 0) + (c[r >> 2] | 0) | 0)) {
                if ((a | 0) != (-1 | 0)) {
                  h = b;
                  g = a;
                  v = 135;
                  break b
                }
              } else {
                e = a;
                v = 126
              }
            } else b = 0
          } else v = 118;
        while (0);
        do
          if ((v | 0) == 118) {
            d = nb(0) | 0;
            if ((d | 0) != (-1 | 0) ? (b = d, p = c[647] | 0, q = p + -1 | 0, b = ((q & b | 0) == 0 ? 0 : (q + b & 0 - p) - b | 0) + k | 0, p = c[636] | 0, q = b + p | 0, b >>> 0 > n >>> 0 & b >>> 0 < 2147483647) : 0) {
              r = c[638] | 0;
              if (r | 0 ? q >>> 0 <= p >>> 0 | q >>> 0 > r >>> 0 : 0) {
                b = 0;
                break
              }
              a = nb(b | 0) | 0;
              if ((a | 0) == (d | 0)) {
                h = b;
                g = d;
                v = 135;
                break b
              } else {
                e = a;
                v = 126
              }
            } else b = 0
          }
        while (0);
        do
          if ((v | 0) == 126) {
            d = 0 - b | 0;
            if (!(i >>> 0 > b >>> 0 & (b >>> 0 < 2147483647 & (e | 0) != (-1 | 0))))
              if ((e | 0) == (-1 | 0)) {
                b = 0;
                break
              } else {
                h = b;
                g = e;
                v = 135;
                break b
              }
            a = c[648] | 0;
            a = j - b + a & 0 - a;
            if (a >>> 0 >= 2147483647) {
              h = b;
              g = e;
              v = 135;
              break b
            }
            if ((nb(a | 0) | 0) == (-1 | 0)) {
              nb(d | 0) | 0;
              b = 0;
              break
            } else {
              h = a + b | 0;
              g = e;
              v = 135;
              break b
            }
          }
        while (0);
        c[639] = c[639] | 4;
        v = 133
      } else {
        b = 0;
        v = 133
      }
    while (0);
    if (((v | 0) == 133 ? k >>> 0 < 2147483647 : 0) ? (u = nb(k | 0) | 0, r = nb(0) | 0, s = r - u | 0, t = s >>> 0 > (n + 40 | 0) >>> 0, !((u | 0) == (-1 | 0) | t ^ 1 | u >>> 0 < r >>> 0 & ((u | 0) != (-1 | 0) & (r | 0) != (-1 | 0)) ^ 1)) : 0) {
      h = t ? s : b;
      g = u;
      v = 135
    }
    if ((v | 0) == 135) {
      b = (c[636] | 0) + h | 0;
      c[636] = b;
      if (b >>> 0 > (c[637] | 0) >>> 0) c[637] = b;
      j = c[534] | 0;
      do
        if (j) {
          b = 2560;
          while (1) {
            a = c[b >> 2] | 0;
            d = b + 4 | 0;
            e = c[d >> 2] | 0;
            if ((g | 0) == (a + e | 0)) {
              v = 145;
              break
            }
            f = c[b + 8 >> 2] | 0;
            if (!f) break;
            else b = f
          }
          if (((v | 0) == 145 ? (c[b + 12 >> 2] & 8 | 0) == 0 : 0) ? j >>> 0 < g >>> 0 & j >>> 0 >= a >>> 0 : 0) {
            c[d >> 2] = e + h;
            w = j + 8 | 0;
            w = (w & 7 | 0) == 0 ? 0 : 0 - w & 7;
            v = j + w | 0;
            w = (c[531] | 0) + (h - w) | 0;
            c[534] = v;
            c[531] = w;
            c[v + 4 >> 2] = w | 1;
            c[v + w + 4 >> 2] = 40;
            c[535] = c[650];
            break
          }
          if (g >>> 0 < (c[532] | 0) >>> 0) c[532] = g;
          d = g + h | 0;
          b = 2560;
          while (1) {
            if ((c[b >> 2] | 0) == (d | 0)) {
              v = 153;
              break
            }
            a = c[b + 8 >> 2] | 0;
            if (!a) break;
            else b = a
          }
          if ((v | 0) == 153 ? (c[b + 12 >> 2] & 8 | 0) == 0 : 0) {
            c[b >> 2] = g;
            m = b + 4 | 0;
            c[m >> 2] = (c[m >> 2] | 0) + h;
            m = g + 8 | 0;
            m = g + ((m & 7 | 0) == 0 ? 0 : 0 - m & 7) | 0;
            b = d + 8 | 0;
            b = d + ((b & 7 | 0) == 0 ? 0 : 0 - b & 7) | 0;
            k = m + n | 0;
            i = b - m - n | 0;
            c[m + 4 >> 2] = n | 3;
            do
              if ((b | 0) != (j | 0)) {
                if ((b | 0) == (c[533] | 0)) {
                  w = (c[530] | 0) + i | 0;
                  c[530] = w;
                  c[533] = k;
                  c[k + 4 >> 2] = w | 1;
                  c[k + w >> 2] = w;
                  break
                }
                a = c[b + 4 >> 2] | 0;
                if ((a & 3 | 0) == 1) {
                  h = a & -8;
                  e = a >>> 3;
                  d: do
                    if (a >>> 0 < 256) {
                      a = c[b + 8 >> 2] | 0;
                      d = c[b + 12 >> 2] | 0;
                      if ((d | 0) == (a | 0)) {
                        c[528] = c[528] & ~(1 << e);
                        break
                      } else {
                        c[a + 12 >> 2] = d;
                        c[d + 8 >> 2] = a;
                        break
                      }
                    } else {
                      g = c[b + 24 >> 2] | 0;
                      a = c[b + 12 >> 2] | 0;
                      do
                        if ((a | 0) == (b | 0)) {
                          e = b + 16 | 0;
                          d = e + 4 | 0;
                          a = c[d >> 2] | 0;
                          if (!a) {
                            a = c[e >> 2] | 0;
                            if (!a) {
                              a = 0;
                              break
                            } else d = e
                          }
                          while (1) {
                            e = a + 20 | 0;
                            f = c[e >> 2] | 0;
                            if (f | 0) {
                              a = f;
                              d = e;
                              continue
                            }
                            e = a + 16 | 0;
                            f = c[e >> 2] | 0;
                            if (!f) break;
                            else {
                              a = f;
                              d = e
                            }
                          }
                          c[d >> 2] = 0
                        } else {
                          w = c[b + 8 >> 2] | 0;
                          c[w + 12 >> 2] = a;
                          c[a + 8 >> 2] = w
                        }
                      while (0);
                      if (!g) break;
                      d = c[b + 28 >> 2] | 0;
                      e = 2416 + (d << 2) | 0;
                      do
                        if ((b | 0) != (c[e >> 2] | 0)) {
                          c[g + 16 + (((c[g + 16 >> 2] | 0) != (b | 0) & 1) << 2) >> 2] = a;
                          if (!a) break d
                        } else {
                          c[e >> 2] = a;
                          if (a | 0) break;
                          c[529] = c[529] & ~(1 << d);
                          break d
                        }
                      while (0);
                      c[a + 24 >> 2] = g;
                      d = b + 16 | 0;
                      e = c[d >> 2] | 0;
                      if (e | 0) {
                        c[a + 16 >> 2] = e;
                        c[e + 24 >> 2] = a
                      }
                      d = c[d + 4 >> 2] | 0;
                      if (!d) break;
                      c[a + 20 >> 2] = d;
                      c[d + 24 >> 2] = a
                    }
                  while (0);
                  b = b + h | 0;
                  f = h + i | 0
                } else f = i;
                b = b + 4 | 0;
                c[b >> 2] = c[b >> 2] & -2;
                c[k + 4 >> 2] = f | 1;
                c[k + f >> 2] = f;
                b = f >>> 3;
                if (f >>> 0 < 256) {
                  d = 2152 + (b << 1 << 2) | 0;
                  a = c[528] | 0;
                  b = 1 << b;
                  if (!(a & b)) {
                    c[528] = a | b;
                    b = d;
                    a = d + 8 | 0
                  } else {
                    a = d + 8 | 0;
                    b = c[a >> 2] | 0
                  }
                  c[a >> 2] = k;
                  c[b + 12 >> 2] = k;
                  c[k + 8 >> 2] = b;
                  c[k + 12 >> 2] = d;
                  break
                }
                b = f >>> 8;
                do
                  if (!b) b = 0;
                  else {
                    if (f >>> 0 > 16777215) {
                      b = 31;
                      break
                    }
                    v = (b + 1048320 | 0) >>> 16 & 8;
                    w = b << v;
                    u = (w + 520192 | 0) >>> 16 & 4;
                    w = w << u;
                    b = (w + 245760 | 0) >>> 16 & 2;
                    b = 14 - (u | v | b) + (w << b >>> 15) | 0;
                    b = f >>> (b + 7 | 0) & 1 | b << 1
                  }
                while (0);
                e = 2416 + (b << 2) | 0;
                c[k + 28 >> 2] = b;
                a = k + 16 | 0;
                c[a + 4 >> 2] = 0;
                c[a >> 2] = 0;
                a = c[529] | 0;
                d = 1 << b;
                if (!(a & d)) {
                  c[529] = a | d;
                  c[e >> 2] = k;
                  c[k + 24 >> 2] = e;
                  c[k + 12 >> 2] = k;
                  c[k + 8 >> 2] = k;
                  break
                }
                a = f << ((b | 0) == 31 ? 0 : 25 - (b >>> 1) | 0);
                d = c[e >> 2] | 0;
                while (1) {
                  if ((c[d + 4 >> 2] & -8 | 0) == (f | 0)) {
                    v = 194;
                    break
                  }
                  e = d + 16 + (a >>> 31 << 2) | 0;
                  b = c[e >> 2] | 0;
                  if (!b) {
                    v = 193;
                    break
                  } else {
                    a = a << 1;
                    d = b
                  }
                }
                if ((v | 0) == 193) {
                  c[e >> 2] = k;
                  c[k + 24 >> 2] = d;
                  c[k + 12 >> 2] = k;
                  c[k + 8 >> 2] = k;
                  break
                } else if ((v | 0) == 194) {
                  v = d + 8 | 0;
                  w = c[v >> 2] | 0;
                  c[w + 12 >> 2] = k;
                  c[v >> 2] = k;
                  c[k + 8 >> 2] = w;
                  c[k + 12 >> 2] = d;
                  c[k + 24 >> 2] = 0;
                  break
                }
              } else {
                w = (c[531] | 0) + i | 0;
                c[531] = w;
                c[534] = k;
                c[k + 4 >> 2] = w | 1
              }
            while (0);
            w = m + 8 | 0;
            l = x;
            return w | 0
          }
          b = 2560;
          while (1) {
            a = c[b >> 2] | 0;
            if (a >>> 0 <= j >>> 0 ? (w = a + (c[b + 4 >> 2] | 0) | 0, w >>> 0 > j >>> 0) : 0) break;
            b = c[b + 8 >> 2] | 0
          }
          f = w + -47 | 0;
          a = f + 8 | 0;
          a = f + ((a & 7 | 0) == 0 ? 0 : 0 - a & 7) | 0;
          f = j + 16 | 0;
          a = a >>> 0 < f >>> 0 ? j : a;
          b = a + 8 | 0;
          d = g + 8 | 0;
          d = (d & 7 | 0) == 0 ? 0 : 0 - d & 7;
          v = g + d | 0;
          d = h + -40 - d | 0;
          c[534] = v;
          c[531] = d;
          c[v + 4 >> 2] = d | 1;
          c[v + d + 4 >> 2] = 40;
          c[535] = c[650];
          d = a + 4 | 0;
          c[d >> 2] = 27;
          c[b >> 2] = c[640];
          c[b + 4 >> 2] = c[641];
          c[b + 8 >> 2] = c[642];
          c[b + 12 >> 2] = c[643];
          c[640] = g;
          c[641] = h;
          c[643] = 0;
          c[642] = b;
          b = a + 24 | 0;
          do {
            v = b;
            b = b + 4 | 0;
            c[b >> 2] = 7
          } while ((v + 8 | 0) >>> 0 < w >>> 0);
          if ((a | 0) != (j | 0)) {
            g = a - j | 0;
            c[d >> 2] = c[d >> 2] & -2;
            c[j + 4 >> 2] = g | 1;
            c[a >> 2] = g;
            b = g >>> 3;
            if (g >>> 0 < 256) {
              d = 2152 + (b << 1 << 2) | 0;
              a = c[528] | 0;
              b = 1 << b;
              if (!(a & b)) {
                c[528] = a | b;
                b = d;
                a = d + 8 | 0
              } else {
                a = d + 8 | 0;
                b = c[a >> 2] | 0
              }
              c[a >> 2] = j;
              c[b + 12 >> 2] = j;
              c[j + 8 >> 2] = b;
              c[j + 12 >> 2] = d;
              break
            }
            b = g >>> 8;
            if (b)
              if (g >>> 0 > 16777215) d = 31;
              else {
                v = (b + 1048320 | 0) >>> 16 & 8;
                w = b << v;
                u = (w + 520192 | 0) >>> 16 & 4;
                w = w << u;
                d = (w + 245760 | 0) >>> 16 & 2;
                d = 14 - (u | v | d) + (w << d >>> 15) | 0;
                d = g >>> (d + 7 | 0) & 1 | d << 1
              } else d = 0;
            e = 2416 + (d << 2) | 0;
            c[j + 28 >> 2] = d;
            c[j + 20 >> 2] = 0;
            c[f >> 2] = 0;
            b = c[529] | 0;
            a = 1 << d;
            if (!(b & a)) {
              c[529] = b | a;
              c[e >> 2] = j;
              c[j + 24 >> 2] = e;
              c[j + 12 >> 2] = j;
              c[j + 8 >> 2] = j;
              break
            }
            a = g << ((d | 0) == 31 ? 0 : 25 - (d >>> 1) | 0);
            d = c[e >> 2] | 0;
            while (1) {
              if ((c[d + 4 >> 2] & -8 | 0) == (g | 0)) {
                v = 216;
                break
              }
              e = d + 16 + (a >>> 31 << 2) | 0;
              b = c[e >> 2] | 0;
              if (!b) {
                v = 215;
                break
              } else {
                a = a << 1;
                d = b
              }
            }
            if ((v | 0) == 215) {
              c[e >> 2] = j;
              c[j + 24 >> 2] = d;
              c[j + 12 >> 2] = j;
              c[j + 8 >> 2] = j;
              break
            } else if ((v | 0) == 216) {
              v = d + 8 | 0;
              w = c[v >> 2] | 0;
              c[w + 12 >> 2] = j;
              c[v >> 2] = j;
              c[j + 8 >> 2] = w;
              c[j + 12 >> 2] = d;
              c[j + 24 >> 2] = 0;
              break
            }
          }
        } else {
          w = c[532] | 0;
          if ((w | 0) == 0 | g >>> 0 < w >>> 0) c[532] = g;
          c[640] = g;
          c[641] = h;
          c[643] = 0;
          c[537] = c[646];
          c[536] = -1;
          b = 0;
          do {
            w = 2152 + (b << 1 << 2) | 0;
            c[w + 12 >> 2] = w;
            c[w + 8 >> 2] = w;
            b = b + 1 | 0
          } while ((b | 0) != 32);
          w = g + 8 | 0;
          w = (w & 7 | 0) == 0 ? 0 : 0 - w & 7;
          v = g + w | 0;
          w = h + -40 - w | 0;
          c[534] = v;
          c[531] = w;
          c[v + 4 >> 2] = w | 1;
          c[v + w + 4 >> 2] = 40;
          c[535] = c[650]
        }
      while (0);
      b = c[531] | 0;
      if (b >>> 0 > n >>> 0) {
        u = b - n | 0;
        c[531] = u;
        w = c[534] | 0;
        v = w + n | 0;
        c[534] = v;
        c[v + 4 >> 2] = u | 1;
        c[w + 4 >> 2] = n | 3;
        w = w + 8 | 0;
        l = x;
        return w | 0
      }
    }
    c[(hb() | 0) >> 2] = 12;
    w = 0;
    l = x;
    return w | 0
  }

  function eb(a) {
    a = a | 0;
    var b = 0,
      d = 0,
      e = 0,
      f = 0,
      g = 0,
      h = 0,
      i = 0,
      j = 0;
    if (!a) return;
    d = a + -8 | 0;
    f = c[532] | 0;
    a = c[a + -4 >> 2] | 0;
    b = a & -8;
    j = d + b | 0;
    do
      if (!(a & 1)) {
        e = c[d >> 2] | 0;
        if (!(a & 3)) return;
        h = d + (0 - e) | 0;
        g = e + b | 0;
        if (h >>> 0 < f >>> 0) return;
        if ((h | 0) == (c[533] | 0)) {
          a = j + 4 | 0;
          b = c[a >> 2] | 0;
          if ((b & 3 | 0) != 3) {
            i = h;
            b = g;
            break
          }
          c[530] = g;
          c[a >> 2] = b & -2;
          c[h + 4 >> 2] = g | 1;
          c[h + g >> 2] = g;
          return
        }
        d = e >>> 3;
        if (e >>> 0 < 256) {
          a = c[h + 8 >> 2] | 0;
          b = c[h + 12 >> 2] | 0;
          if ((b | 0) == (a | 0)) {
            c[528] = c[528] & ~(1 << d);
            i = h;
            b = g;
            break
          } else {
            c[a + 12 >> 2] = b;
            c[b + 8 >> 2] = a;
            i = h;
            b = g;
            break
          }
        }
        f = c[h + 24 >> 2] | 0;
        a = c[h + 12 >> 2] | 0;
        do
          if ((a | 0) == (h | 0)) {
            d = h + 16 | 0;
            b = d + 4 | 0;
            a = c[b >> 2] | 0;
            if (!a) {
              a = c[d >> 2] | 0;
              if (!a) {
                a = 0;
                break
              } else b = d
            }
            while (1) {
              d = a + 20 | 0;
              e = c[d >> 2] | 0;
              if (e | 0) {
                a = e;
                b = d;
                continue
              }
              d = a + 16 | 0;
              e = c[d >> 2] | 0;
              if (!e) break;
              else {
                a = e;
                b = d
              }
            }
            c[b >> 2] = 0
          } else {
            i = c[h + 8 >> 2] | 0;
            c[i + 12 >> 2] = a;
            c[a + 8 >> 2] = i
          }
        while (0);
        if (f) {
          b = c[h + 28 >> 2] | 0;
          d = 2416 + (b << 2) | 0;
          if ((h | 0) == (c[d >> 2] | 0)) {
            c[d >> 2] = a;
            if (!a) {
              c[529] = c[529] & ~(1 << b);
              i = h;
              b = g;
              break
            }
          } else {
            c[f + 16 + (((c[f + 16 >> 2] | 0) != (h | 0) & 1) << 2) >> 2] = a;
            if (!a) {
              i = h;
              b = g;
              break
            }
          }
          c[a + 24 >> 2] = f;
          b = h + 16 | 0;
          d = c[b >> 2] | 0;
          if (d | 0) {
            c[a + 16 >> 2] = d;
            c[d + 24 >> 2] = a
          }
          b = c[b + 4 >> 2] | 0;
          if (b) {
            c[a + 20 >> 2] = b;
            c[b + 24 >> 2] = a;
            i = h;
            b = g
          } else {
            i = h;
            b = g
          }
        } else {
          i = h;
          b = g
        }
      } else {
        i = d;
        h = d
      }
    while (0);
    if (h >>> 0 >= j >>> 0) return;
    a = j + 4 | 0;
    e = c[a >> 2] | 0;
    if (!(e & 1)) return;
    if (!(e & 2)) {
      a = c[533] | 0;
      if ((j | 0) == (c[534] | 0)) {
        j = (c[531] | 0) + b | 0;
        c[531] = j;
        c[534] = i;
        c[i + 4 >> 2] = j | 1;
        if ((i | 0) != (a | 0)) return;
        c[533] = 0;
        c[530] = 0;
        return
      }
      if ((j | 0) == (a | 0)) {
        j = (c[530] | 0) + b | 0;
        c[530] = j;
        c[533] = h;
        c[i + 4 >> 2] = j | 1;
        c[h + j >> 2] = j;
        return
      }
      f = (e & -8) + b | 0;
      d = e >>> 3;
      do
        if (e >>> 0 < 256) {
          b = c[j + 8 >> 2] | 0;
          a = c[j + 12 >> 2] | 0;
          if ((a | 0) == (b | 0)) {
            c[528] = c[528] & ~(1 << d);
            break
          } else {
            c[b + 12 >> 2] = a;
            c[a + 8 >> 2] = b;
            break
          }
        } else {
          g = c[j + 24 >> 2] | 0;
          a = c[j + 12 >> 2] | 0;
          do
            if ((a | 0) == (j | 0)) {
              d = j + 16 | 0;
              b = d + 4 | 0;
              a = c[b >> 2] | 0;
              if (!a) {
                a = c[d >> 2] | 0;
                if (!a) {
                  d = 0;
                  break
                } else b = d
              }
              while (1) {
                d = a + 20 | 0;
                e = c[d >> 2] | 0;
                if (e | 0) {
                  a = e;
                  b = d;
                  continue
                }
                d = a + 16 | 0;
                e = c[d >> 2] | 0;
                if (!e) break;
                else {
                  a = e;
                  b = d
                }
              }
              c[b >> 2] = 0;
              d = a
            } else {
              d = c[j + 8 >> 2] | 0;
              c[d + 12 >> 2] = a;
              c[a + 8 >> 2] = d;
              d = a
            }
          while (0);
          if (g | 0) {
            a = c[j + 28 >> 2] | 0;
            b = 2416 + (a << 2) | 0;
            if ((j | 0) == (c[b >> 2] | 0)) {
              c[b >> 2] = d;
              if (!d) {
                c[529] = c[529] & ~(1 << a);
                break
              }
            } else {
              c[g + 16 + (((c[g + 16 >> 2] | 0) != (j | 0) & 1) << 2) >> 2] = d;
              if (!d) break
            }
            c[d + 24 >> 2] = g;
            a = j + 16 | 0;
            b = c[a >> 2] | 0;
            if (b | 0) {
              c[d + 16 >> 2] = b;
              c[b + 24 >> 2] = d
            }
            a = c[a + 4 >> 2] | 0;
            if (a | 0) {
              c[d + 20 >> 2] = a;
              c[a + 24 >> 2] = d
            }
          }
        }
      while (0);
      c[i + 4 >> 2] = f | 1;
      c[h + f >> 2] = f;
      if ((i | 0) == (c[533] | 0)) {
        c[530] = f;
        return
      }
    } else {
      c[a >> 2] = e & -2;
      c[i + 4 >> 2] = b | 1;
      c[h + b >> 2] = b;
      f = b
    }
    a = f >>> 3;
    if (f >>> 0 < 256) {
      d = 2152 + (a << 1 << 2) | 0;
      b = c[528] | 0;
      a = 1 << a;
      if (!(b & a)) {
        c[528] = b | a;
        a = d;
        b = d + 8 | 0
      } else {
        b = d + 8 | 0;
        a = c[b >> 2] | 0
      }
      c[b >> 2] = i;
      c[a + 12 >> 2] = i;
      c[i + 8 >> 2] = a;
      c[i + 12 >> 2] = d;
      return
    }
    a = f >>> 8;
    if (a)
      if (f >>> 0 > 16777215) a = 31;
      else {
        h = (a + 1048320 | 0) >>> 16 & 8;
        j = a << h;
        g = (j + 520192 | 0) >>> 16 & 4;
        j = j << g;
        a = (j + 245760 | 0) >>> 16 & 2;
        a = 14 - (g | h | a) + (j << a >>> 15) | 0;
        a = f >>> (a + 7 | 0) & 1 | a << 1
      } else a = 0;
    e = 2416 + (a << 2) | 0;
    c[i + 28 >> 2] = a;
    c[i + 20 >> 2] = 0;
    c[i + 16 >> 2] = 0;
    b = c[529] | 0;
    d = 1 << a;
    do
      if (b & d) {
        b = f << ((a | 0) == 31 ? 0 : 25 - (a >>> 1) | 0);
        d = c[e >> 2] | 0;
        while (1) {
          if ((c[d + 4 >> 2] & -8 | 0) == (f | 0)) {
            a = 73;
            break
          }
          e = d + 16 + (b >>> 31 << 2) | 0;
          a = c[e >> 2] | 0;
          if (!a) {
            a = 72;
            break
          } else {
            b = b << 1;
            d = a
          }
        }
        if ((a | 0) == 72) {
          c[e >> 2] = i;
          c[i + 24 >> 2] = d;
          c[i + 12 >> 2] = i;
          c[i + 8 >> 2] = i;
          break
        } else if ((a | 0) == 73) {
          h = d + 8 | 0;
          j = c[h >> 2] | 0;
          c[j + 12 >> 2] = i;
          c[h >> 2] = i;
          c[i + 8 >> 2] = j;
          c[i + 12 >> 2] = d;
          c[i + 24 >> 2] = 0;
          break
        }
      } else {
        c[529] = b | d;
        c[e >> 2] = i;
        c[i + 24 >> 2] = e;
        c[i + 12 >> 2] = i;
        c[i + 8 >> 2] = i
      }
    while (0);
    j = (c[536] | 0) + -1 | 0;
    c[536] = j;
    if (!j) a = 2568;
    else return;
    while (1) {
      a = c[a >> 2] | 0;
      if (!a) break;
      else a = a + 8 | 0
    }
    c[536] = -1;
    return
  }

  function fb(a, b) {
    a = a | 0;
    b = b | 0;
    var d = 0;
    if (a) {
      d = O(b, a) | 0;
      if ((b | a) >>> 0 > 65535) d = ((d >>> 0) / (a >>> 0) | 0 | 0) == (b | 0) ? d : -1
    } else d = 0;
    a = db(d) | 0;
    if (!a) return a | 0;
    if (!(c[a + -4 >> 2] & 3)) return a | 0;
    pb(a | 0, 0, d | 0) | 0;
    return a | 0
  }

  function gb() {
    return 2608
  }

  function hb() {
    return (ib() | 0) + 64 | 0
  }

  function ib() {
    return jb() | 0
  }

  function jb() {
    return 840
  }

  function kb(b) {
    b = b | 0;
    var d = 0,
      e = 0,
      f = 0;
    f = b;
    a: do
      if (!(f & 3)) e = 4;
      else {
        d = f;
        while (1) {
          if (!(a[b >> 0] | 0)) {
            b = d;
            break a
          }
          b = b + 1 | 0;
          d = b;
          if (!(d & 3)) {
            e = 4;
            break
          }
        }
      }
    while (0);
    if ((e | 0) == 4) {
      while (1) {
        d = c[b >> 2] | 0;
        if (!((d & -2139062144 ^ -2139062144) & d + -16843009)) b = b + 4 | 0;
        else break
      }
      if ((d & 255) << 24 >> 24)
        do b = b + 1 | 0; while ((a[b >> 0] | 0) != 0)
    }
    return b - f | 0
  }

  function lb() { }

  function mb(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    d = b - d - (c >>> 0 > a >>> 0 | 0) >>> 0;
    return (z = d, a - c >>> 0 | 0) | 0
  }

  function nb(a) {
    a = a | 0;
    var b = 0,
      d = 0;
    d = a + 15 & -16 | 0;
    b = c[i >> 2] | 0;
    a = b + d | 0;
    if ((d | 0) > 0 & (a | 0) < (b | 0) | (a | 0) < 0) {
      W() | 0;
      Z(12);
      return -1
    }
    c[i >> 2] = a;
    if ((a | 0) > (V() | 0) ? (U() | 0) == 0 : 0) {
      c[i >> 2] = b;
      Z(12);
      return -1
    }
    return b | 0
  }

  function ob(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    c = a + c >>> 0;
    return (z = b + d + (c >>> 0 < a >>> 0 | 0) >>> 0, c | 0) | 0
  }

  function pb(b, d, e) {
    b = b | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0,
      h = 0,
      i = 0;
    h = b + e | 0;
    d = d & 255;
    if ((e | 0) >= 67) {
      while (b & 3) {
        a[b >> 0] = d;
        b = b + 1 | 0
      }
      f = h & -4 | 0;
      g = f - 64 | 0;
      i = d | d << 8 | d << 16 | d << 24;
      while ((b | 0) <= (g | 0)) {
        c[b >> 2] = i;
        c[b + 4 >> 2] = i;
        c[b + 8 >> 2] = i;
        c[b + 12 >> 2] = i;
        c[b + 16 >> 2] = i;
        c[b + 20 >> 2] = i;
        c[b + 24 >> 2] = i;
        c[b + 28 >> 2] = i;
        c[b + 32 >> 2] = i;
        c[b + 36 >> 2] = i;
        c[b + 40 >> 2] = i;
        c[b + 44 >> 2] = i;
        c[b + 48 >> 2] = i;
        c[b + 52 >> 2] = i;
        c[b + 56 >> 2] = i;
        c[b + 60 >> 2] = i;
        b = b + 64 | 0
      }
      while ((b | 0) < (f | 0)) {
        c[b >> 2] = i;
        b = b + 4 | 0
      }
    }
    while ((b | 0) < (h | 0)) {
      a[b >> 0] = d;
      b = b + 1 | 0
    }
    return h - e | 0
  }

  function qb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    if ((c | 0) < 32) {
      z = b >>> c;
      return a >>> c | (b & (1 << c) - 1) << 32 - c
    }
    z = 0;
    return b >>> c - 32 | 0
  }

  function rb(a, b, c) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    if ((c | 0) < 32) {
      z = b << c | (a & (1 << c) - 1 << 32 - c) >>> 32 - c;
      return a << c
    }
    z = a << c - 32;
    return 0
  }

  function sb(b) {
    b = b | 0;
    var c = 0;
    c = a[n + (b & 255) >> 0] | 0;
    if ((c | 0) < 8) return c | 0;
    c = a[n + (b >> 8 & 255) >> 0] | 0;
    if ((c | 0) < 8) return c + 8 | 0;
    c = a[n + (b >> 16 & 255) >> 0] | 0;
    if ((c | 0) < 8) return c + 16 | 0;
    return (a[n + (b >>> 24) >> 0] | 0) + 24 | 0
  }

  function tb(a, b, d, e, f) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    e = e | 0;
    f = f | 0;
    var g = 0,
      h = 0,
      i = 0,
      j = 0,
      k = 0,
      l = 0,
      m = 0,
      n = 0,
      o = 0,
      p = 0;
    l = a;
    j = b;
    k = j;
    h = d;
    n = e;
    i = n;
    if (!k) {
      g = (f | 0) != 0;
      if (!i) {
        if (g) {
          c[f >> 2] = (l >>> 0) % (h >>> 0);
          c[f + 4 >> 2] = 0
        }
        n = 0;
        f = (l >>> 0) / (h >>> 0) >>> 0;
        return (z = n, f) | 0
      } else {
        if (!g) {
          n = 0;
          f = 0;
          return (z = n, f) | 0
        }
        c[f >> 2] = a | 0;
        c[f + 4 >> 2] = b & 0;
        n = 0;
        f = 0;
        return (z = n, f) | 0
      }
    }
    g = (i | 0) == 0;
    do
      if (h) {
        if (!g) {
          g = (R(i | 0) | 0) - (R(k | 0) | 0) | 0;
          if (g >>> 0 <= 31) {
            m = g + 1 | 0;
            i = 31 - g | 0;
            b = g - 31 >> 31;
            h = m;
            a = l >>> (m >>> 0) & b | k << i;
            b = k >>> (m >>> 0) & b;
            g = 0;
            i = l << i;
            break
          }
          if (!f) {
            n = 0;
            f = 0;
            return (z = n, f) | 0
          }
          c[f >> 2] = a | 0;
          c[f + 4 >> 2] = j | b & 0;
          n = 0;
          f = 0;
          return (z = n, f) | 0
        }
        g = h - 1 | 0;
        if (g & h | 0) {
          i = (R(h | 0) | 0) + 33 - (R(k | 0) | 0) | 0;
          p = 64 - i | 0;
          m = 32 - i | 0;
          j = m >> 31;
          o = i - 32 | 0;
          b = o >> 31;
          h = i;
          a = m - 1 >> 31 & k >>> (o >>> 0) | (k << m | l >>> (i >>> 0)) & b;
          b = b & k >>> (i >>> 0);
          g = l << p & j;
          i = (k << p | l >>> (o >>> 0)) & j | l << m & i - 33 >> 31;
          break
        }
        if (f | 0) {
          c[f >> 2] = g & l;
          c[f + 4 >> 2] = 0
        }
        if ((h | 0) == 1) {
          o = j | b & 0;
          p = a | 0 | 0;
          return (z = o, p) | 0
        } else {
          p = sb(h | 0) | 0;
          o = k >>> (p >>> 0) | 0;
          p = k << 32 - p | l >>> (p >>> 0) | 0;
          return (z = o, p) | 0
        }
      } else {
        if (g) {
          if (f | 0) {
            c[f >> 2] = (k >>> 0) % (h >>> 0);
            c[f + 4 >> 2] = 0
          }
          o = 0;
          p = (k >>> 0) / (h >>> 0) >>> 0;
          return (z = o, p) | 0
        }
        if (!l) {
          if (f | 0) {
            c[f >> 2] = 0;
            c[f + 4 >> 2] = (k >>> 0) % (i >>> 0)
          }
          o = 0;
          p = (k >>> 0) / (i >>> 0) >>> 0;
          return (z = o, p) | 0
        }
        g = i - 1 | 0;
        if (!(g & i)) {
          if (f | 0) {
            c[f >> 2] = a | 0;
            c[f + 4 >> 2] = g & k | b & 0
          }
          o = 0;
          p = k >>> ((sb(i | 0) | 0) >>> 0);
          return (z = o, p) | 0
        }
        g = (R(i | 0) | 0) - (R(k | 0) | 0) | 0;
        if (g >>> 0 <= 30) {
          b = g + 1 | 0;
          i = 31 - g | 0;
          h = b;
          a = k << i | l >>> (b >>> 0);
          b = k >>> (b >>> 0);
          g = 0;
          i = l << i;
          break
        }
        if (!f) {
          o = 0;
          p = 0;
          return (z = o, p) | 0
        }
        c[f >> 2] = a | 0;
        c[f + 4 >> 2] = j | b & 0;
        o = 0;
        p = 0;
        return (z = o, p) | 0
      }
    while (0);
    if (!h) {
      k = i;
      j = 0;
      i = 0
    } else {
      m = d | 0 | 0;
      l = n | e & 0;
      k = ob(m | 0, l | 0, -1, -1) | 0;
      d = z;
      j = i;
      i = 0;
      do {
        e = j;
        j = g >>> 31 | j << 1;
        g = i | g << 1;
        e = a << 1 | e >>> 31 | 0;
        n = a >>> 31 | b << 1 | 0;
        mb(k | 0, d | 0, e | 0, n | 0) | 0;
        p = z;
        o = p >> 31 | ((p | 0) < 0 ? -1 : 0) << 1;
        i = o & 1;
        a = mb(e | 0, n | 0, o & m | 0, (((p | 0) < 0 ? -1 : 0) >> 31 | ((p | 0) < 0 ? -1 : 0) << 1) & l | 0) | 0;
        b = z;
        h = h - 1 | 0
      } while ((h | 0) != 0);
      k = j;
      j = 0
    }
    h = 0;
    if (f | 0) {
      c[f >> 2] = a;
      c[f + 4 >> 2] = b
    }
    o = (g | 0) >>> 31 | (k | h) << 1 | (h << 1 | g >>> 31) & 0 | j;
    p = (g << 1 | 0 >>> 31) & -2 | i;
    return (z = o, p) | 0
  }

  function ub(a, b, d, e) {
    a = a | 0;
    b = b | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0;
    g = l;
    l = l + 16 | 0;
    f = g | 0;
    tb(a, b, d, e, f) | 0;
    l = g;
    return (z = c[f + 4 >> 2] | 0, c[f >> 2] | 0) | 0
  }

  function vb(a, b) {
    a = a | 0;
    b = b | 0;
    var c = 0,
      d = 0,
      e = 0,
      f = 0;
    f = a & 65535;
    e = b & 65535;
    c = O(e, f) | 0;
    d = a >>> 16;
    a = (c >>> 16) + (O(e, d) | 0) | 0;
    e = b >>> 16;
    b = O(e, f) | 0;
    return (z = (a >>> 16) + (O(e, d) | 0) + (((a & 65535) + b | 0) >>> 16) | 0, a + b << 16 | c & 65535 | 0) | 0
  }

  function wb(a, b, c, d) {
    a = a | 0;
    b = b | 0;
    c = c | 0;
    d = d | 0;
    var e = 0,
      f = 0;
    e = a;
    f = c;
    c = vb(e, f) | 0;
    a = z;
    return (z = (O(b, f) | 0) + (O(d, e) | 0) + a | a & 0, c | 0 | 0) | 0
  }

  function xb(b, d, e) {
    b = b | 0;
    d = d | 0;
    e = e | 0;
    var f = 0,
      g = 0,
      h = 0;
    if ((e | 0) >= 8192) return Y(b | 0, d | 0, e | 0) | 0;
    h = b | 0;
    g = b + e | 0;
    if ((b & 3) == (d & 3)) {
      while (b & 3) {
        if (!e) return h | 0;
        a[b >> 0] = a[d >> 0] | 0;
        b = b + 1 | 0;
        d = d + 1 | 0;
        e = e - 1 | 0
      }
      e = g & -4 | 0;
      f = e - 64 | 0;
      while ((b | 0) <= (f | 0)) {
        c[b >> 2] = c[d >> 2];
        c[b + 4 >> 2] = c[d + 4 >> 2];
        c[b + 8 >> 2] = c[d + 8 >> 2];
        c[b + 12 >> 2] = c[d + 12 >> 2];
        c[b + 16 >> 2] = c[d + 16 >> 2];
        c[b + 20 >> 2] = c[d + 20 >> 2];
        c[b + 24 >> 2] = c[d + 24 >> 2];
        c[b + 28 >> 2] = c[d + 28 >> 2];
        c[b + 32 >> 2] = c[d + 32 >> 2];
        c[b + 36 >> 2] = c[d + 36 >> 2];
        c[b + 40 >> 2] = c[d + 40 >> 2];
        c[b + 44 >> 2] = c[d + 44 >> 2];
        c[b + 48 >> 2] = c[d + 48 >> 2];
        c[b + 52 >> 2] = c[d + 52 >> 2];
        c[b + 56 >> 2] = c[d + 56 >> 2];
        c[b + 60 >> 2] = c[d + 60 >> 2];
        b = b + 64 | 0;
        d = d + 64 | 0
      }
      while ((b | 0) < (e | 0)) {
        c[b >> 2] = c[d >> 2];
        b = b + 4 | 0;
        d = d + 4 | 0
      }
    } else {
      e = g - 4 | 0;
      while ((b | 0) < (e | 0)) {
        a[b >> 0] = a[d >> 0] | 0;
        a[b + 1 >> 0] = a[d + 1 >> 0] | 0;
        a[b + 2 >> 0] = a[d + 2 >> 0] | 0;
        a[b + 3 >> 0] = a[d + 3 >> 0] | 0;
        b = b + 4 | 0;
        d = d + 4 | 0
      }
    }
    while ((b | 0) < (g | 0)) {
      a[b >> 0] = a[d >> 0] | 0;
      b = b + 1 | 0;
      d = d + 1 | 0
    }
    return h | 0
  }

  // EMSCRIPTEN_END_FUNCS
  return {
    _i64Subtract: mb,
    setThrew: da,
    _bitshift64Lshr: qb,
    _bitshift64Shl: rb,
    _memset: pb,
    _sbrk: nb,
    _memcpy: xb,
    stackAlloc: $,
    ___muldi3: wb,
    _argon2_hash: za,
    ___uremdi3: ub,
    getTempRet0: fa,
    setTempRet0: ea,
    _i64Add: ob,
    _emscripten_get_global_libc: gb,
    stackSave: aa,
    _free: eb,
    runPostSets: lb,
    establishStackSpace: ca,
    stackRestore: ba,
    _malloc: db,
    _argon2_error_message: Aa
  }
})

  // EMSCRIPTEN_END_ASM
  (Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var getTempRet0 = Module["getTempRet0"] = asm["getTempRet0"];
var setThrew = Module["setThrew"] = asm["setThrew"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _memset = Module["_memset"] = asm["_memset"];
var _sbrk = Module["_sbrk"] = asm["_sbrk"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"];
var ___muldi3 = Module["___muldi3"] = asm["___muldi3"];
var _argon2_hash = Module["_argon2_hash"] = asm["_argon2_hash"];
var ___uremdi3 = Module["___uremdi3"] = asm["___uremdi3"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var setTempRet0 = Module["setTempRet0"] = asm["setTempRet0"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = asm["_emscripten_get_global_libc"];
var stackSave = Module["stackSave"] = asm["stackSave"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var establishStackSpace = Module["establishStackSpace"] = asm["establishStackSpace"];
var stackRestore = Module["stackRestore"] = asm["stackRestore"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _argon2_error_message = Module["_argon2_error_message"] = asm["_argon2_error_message"];
Runtime.stackAlloc = Module["stackAlloc"];
Runtime.stackSave = Module["stackSave"];
Runtime.stackRestore = Module["stackRestore"];
Runtime.establishStackSpace = Module["establishStackSpace"];
Runtime.setTempRet0 = Module["setTempRet0"];
Runtime.getTempRet0 = Module["getTempRet0"];
Module["asm"] = asm;

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  if (!Module["calledRun"]) run();
  if (!Module["calledRun"]) dependenciesFulfilled = runCaller
};
Module["callMain"] = Module.callMain = function callMain(args) {
  args = args || [];
  ensureInitRuntime();
  var argc = args.length + 1;

  function pad() {
    for (var i = 0; i < 4 - 1; i++) {
      argv.push(0)
    }
  }
  var argv = [allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL)];
  pad();
  for (var i = 0; i < argc - 1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
    pad()
  }
  argv.push(0);
  argv = allocate(argv, "i32", ALLOC_NORMAL);
  try {
    var ret = Module["_main"](argc, argv, 0);
    exit(ret, true)
  } catch (e) {
    if (e instanceof ExitStatus) {
      return
    } else if (e == "SimulateInfiniteLoop") {
      Module["noExitRuntime"] = true;
      return
    } else {
      var toLog = e;
      if (e && typeof e === "object" && e.stack) {
        toLog = [e, e.stack]
      }
      Module.printErr("exception thrown: " + toLog);
      Module["quit"](1, e)
    }
  } finally {
    calledMain = true
  }
};

function run(args) {
  args = args || Module["arguments"];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    return
  }
  preRun();
  if (runDependencies > 0) return;
  if (Module["calledRun"]) return;

  function doRun() {
    if (Module["calledRun"]) return;
    Module["calledRun"] = true;
    if (ABORT) return;
    ensureInitRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    if (Module["_main"] && shouldRunNow) Module["callMain"](args);
    postRun()
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout((function () {
      setTimeout((function () {
        Module["setStatus"]("")
      }), 1);
      doRun()
    }), 1)
  } else {
    doRun()
  }
}
Module["run"] = Module.run = run;

function exit(status, implicit) {
  if (implicit && Module["noExitRuntime"]) {
    return
  }
  if (Module["noExitRuntime"]) { } else {
    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;
    exitRuntime();
    if (Module["onExit"]) Module["onExit"](status)
  }
  if (ENVIRONMENT_IS_NODE) {
    process["exit"](status)
  }
  Module["quit"](status, new ExitStatus(status))
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];

function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what)
  }
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = ""
  }
  ABORT = true;
  EXITSTATUS = 1;
  var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
  var output = "abort(" + what + ") at " + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach((function (decorator) {
      output = decorator(output, what)
    }))
  }
  throw output
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()()
  }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
  shouldRunNow = false
}
Module["noExitRuntime"] = true;
run()
