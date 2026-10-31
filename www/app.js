var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins = cap.Plugins = cap.Plugins || {};
      const getPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const isNativePlatform = () => getPlatform() !== "web";
      const isPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const getPluginHeader = (pluginName) => {
        var _a;
        return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
      };
      const handleError = (err) => win.console.error(err);
      const registeredPlugins = /* @__PURE__ */ new Map();
      const registerPlugin2 = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a, _b;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
            }
          } else if (impl) {
            return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p2 = fn(...args);
                remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                return p2;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p.remove = async () => remove();
            }
            return p;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback);
          const remove = async () => {
            const callbackId = await call;
            removeListener({
              eventName,
              callbackId
            }, callback);
          };
          const p = new Promise((resolve2) => call.then(() => resolve2({ remove })));
          p.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p;
        };
        const proxy = new Proxy({}, {
          get(_, prop) {
            switch (prop) {
              // https://github.com/facebook/react/issues/20030
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
        });
        return proxy;
      };
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    WebPlugin = class {
      constructor() {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
      }
      addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
          firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        if (firstListener) {
          this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          if (retainUntilConsumed) {
            let args = this.retainedEventArguments[eventName];
            if (!args) {
              args = [];
            }
            args.push(data);
            this.retainedEventArguments[eventName] = args;
          }
          return;
        }
        listeners.forEach((listener) => listener(data));
      }
      hasListeners(eventName) {
        var _a;
        return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        if (index !== -1) {
          this.listeners[eventName].splice(index, 1);
        }
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
      sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
          return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
          this.notifyListeners(eventName, arg);
        });
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve2, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve2(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
    (function(SystemBarsStyle2) {
      SystemBarsStyle2["Dark"] = "DARK";
      SystemBarsStyle2["Light"] = "LIGHT";
      SystemBarsStyle2["Default"] = "DEFAULT";
    })(SystemBarsStyle || (SystemBarsStyle = {}));
    (function(SystemBarType2) {
      SystemBarType2["StatusBar"] = "StatusBar";
      SystemBarType2["NavigationBar"] = "NavigationBar";
    })(SystemBarType || (SystemBarType = {}));
    SystemBarsPluginWeb = class extends WebPlugin {
      async setStyle() {
        this.unavailable("not available for web");
      }
      async setAnimation() {
        this.unavailable("not available for web");
      }
      async show() {
        this.unavailable("not available for web");
      }
      async hide() {
        this.unavailable("not available for web");
      }
    };
    SystemBars = registerPlugin("SystemBars", {
      web: () => new SystemBarsPluginWeb()
    });
  }
});

// node_modules/@capacitor/filesystem/dist/esm/definitions.js
var Directory, Encoding;
var init_definitions = __esm({
  "node_modules/@capacitor/filesystem/dist/esm/definitions.js"() {
    (function(Directory2) {
      Directory2["Documents"] = "DOCUMENTS";
      Directory2["Data"] = "DATA";
      Directory2["Library"] = "LIBRARY";
      Directory2["Cache"] = "CACHE";
      Directory2["External"] = "EXTERNAL";
      Directory2["ExternalStorage"] = "EXTERNAL_STORAGE";
      Directory2["ExternalCache"] = "EXTERNAL_CACHE";
      Directory2["LibraryNoCloud"] = "LIBRARY_NO_CLOUD";
      Directory2["Temporary"] = "TEMPORARY";
    })(Directory || (Directory = {}));
    (function(Encoding2) {
      Encoding2["UTF8"] = "utf8";
      Encoding2["ASCII"] = "ascii";
      Encoding2["UTF16"] = "utf16";
    })(Encoding || (Encoding = {}));
  }
});

// node_modules/@capacitor/filesystem/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  FilesystemWeb: () => FilesystemWeb
});
function resolve(path) {
  const posix = path.split("/").filter((item) => item !== ".");
  const newPosix = [];
  posix.forEach((item) => {
    if (item === ".." && newPosix.length > 0 && newPosix[newPosix.length - 1] !== "..") {
      newPosix.pop();
    } else {
      newPosix.push(item);
    }
  });
  return newPosix.join("/");
}
function isPathParent(parent, children) {
  parent = resolve(parent);
  children = resolve(children);
  const pathsA = parent.split("/");
  const pathsB = children.split("/");
  return parent !== children && pathsA.every((value, index) => value === pathsB[index]);
}
var FilesystemWeb;
var init_web = __esm({
  "node_modules/@capacitor/filesystem/dist/esm/web.js"() {
    init_dist();
    init_definitions();
    FilesystemWeb = class _FilesystemWeb extends WebPlugin {
      constructor() {
        super(...arguments);
        this.DB_VERSION = 1;
        this.DB_NAME = "Disc";
        this._writeCmds = ["add", "put", "delete"];
        this.downloadFile = async (options) => {
          var _a, _b;
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const response = await fetch(options.url, requestInit);
          let blob;
          if (!options.progress)
            blob = await response.blob();
          else if (!(response === null || response === void 0 ? void 0 : response.body))
            blob = new Blob();
          else {
            const reader = response.body.getReader();
            let bytes = 0;
            const chunks = [];
            const contentType = response.headers.get("content-type");
            const contentLength = parseInt(response.headers.get("content-length") || "0", 10);
            while (true) {
              const { done, value } = await reader.read();
              if (done)
                break;
              chunks.push(value);
              bytes += (value === null || value === void 0 ? void 0 : value.length) || 0;
              const status = {
                url: options.url,
                bytes,
                contentLength
              };
              this.notifyListeners("progress", status);
            }
            const allChunks = new Uint8Array(bytes);
            let position = 0;
            for (const chunk of chunks) {
              if (typeof chunk === "undefined")
                continue;
              allChunks.set(chunk, position);
              position += chunk.length;
            }
            blob = new Blob([allChunks.buffer], { type: contentType || void 0 });
          }
          const result = await this.writeFile({
            path: options.path,
            directory: (_a = options.directory) !== null && _a !== void 0 ? _a : void 0,
            recursive: (_b = options.recursive) !== null && _b !== void 0 ? _b : false,
            data: blob
          });
          return { path: result.uri, blob };
        };
      }
      readFileInChunks(_options, _callback) {
        throw this.unavailable("Method not implemented.");
      }
      async initDb() {
        if (this._db !== void 0) {
          return this._db;
        }
        if (!("indexedDB" in window)) {
          throw this.unavailable("This browser doesn't support IndexedDB");
        }
        return new Promise((resolve2, reject) => {
          const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
          request.onupgradeneeded = _FilesystemWeb.doUpgrade;
          request.onsuccess = () => {
            this._db = request.result;
            resolve2(request.result);
          };
          request.onerror = () => reject(request.error);
          request.onblocked = () => {
            console.warn("db blocked");
          };
        });
      }
      static doUpgrade(event) {
        const eventTarget = event.target;
        const db = eventTarget.result;
        switch (event.oldVersion) {
          case 0:
          case 1:
          default: {
            if (db.objectStoreNames.contains("FileStorage")) {
              db.deleteObjectStore("FileStorage");
            }
            const store = db.createObjectStore("FileStorage", { keyPath: "path" });
            store.createIndex("by_folder", "folder");
          }
        }
      }
      async dbRequest(cmd, args) {
        const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
        return this.initDb().then((conn) => {
          return new Promise((resolve2, reject) => {
            const tx = conn.transaction(["FileStorage"], readFlag);
            const store = tx.objectStore("FileStorage");
            const req = store[cmd](...args);
            req.onsuccess = () => resolve2(req.result);
            req.onerror = () => reject(req.error);
          });
        });
      }
      async dbIndexRequest(indexName, cmd, args) {
        const readFlag = this._writeCmds.indexOf(cmd) !== -1 ? "readwrite" : "readonly";
        return this.initDb().then((conn) => {
          return new Promise((resolve2, reject) => {
            const tx = conn.transaction(["FileStorage"], readFlag);
            const store = tx.objectStore("FileStorage");
            const index = store.index(indexName);
            const req = index[cmd](...args);
            req.onsuccess = () => resolve2(req.result);
            req.onerror = () => reject(req.error);
          });
        });
      }
      getPath(directory, uriPath) {
        const cleanedUriPath = uriPath !== void 0 ? uriPath.replace(/^[/]+|[/]+$/g, "") : "";
        let fsPath = "";
        if (directory !== void 0)
          fsPath += "/" + directory;
        if (uriPath !== "")
          fsPath += "/" + cleanedUriPath;
        return fsPath;
      }
      async clear() {
        const conn = await this.initDb();
        const tx = conn.transaction(["FileStorage"], "readwrite");
        const store = tx.objectStore("FileStorage");
        store.clear();
      }
      /**
       * Read a file from disk
       * @param options options for the file read
       * @return a promise that resolves with the read file data result
       */
      async readFile(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (entry === void 0)
          throw Error("File does not exist.");
        return { data: entry.content ? entry.content : "" };
      }
      /**
       * Write a file to disk in the specified location on device
       * @param options options for the file write
       * @return a promise that resolves with the file write result
       */
      async writeFile(options) {
        const path = this.getPath(options.directory, options.path);
        let data = options.data;
        const encoding = options.encoding;
        const doRecursive = options.recursive;
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (occupiedEntry && occupiedEntry.type === "directory")
          throw Error("The supplied path is a directory.");
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const parentEntry = await this.dbRequest("get", [parentPath]);
        if (parentEntry === void 0) {
          const subDirIndex = parentPath.indexOf("/", 1);
          if (subDirIndex !== -1) {
            const parentArgPath = parentPath.substr(subDirIndex);
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: doRecursive
            });
          }
        }
        if (!encoding && !(data instanceof Blob)) {
          data = data.indexOf(",") >= 0 ? data.split(",")[1] : data;
          if (!this.isBase64String(data))
            throw Error("The supplied data is not valid base64 content.");
        }
        const now = Date.now();
        const pathObj = {
          path,
          folder: parentPath,
          type: "file",
          size: data instanceof Blob ? data.size : data.length,
          ctime: now,
          mtime: now,
          content: data
        };
        await this.dbRequest("put", [pathObj]);
        return {
          uri: pathObj.path
        };
      }
      /**
       * Append to a file on disk in the specified location on device
       * @param options options for the file append
       * @return a promise that resolves with the file write result
       */
      async appendFile(options) {
        const path = this.getPath(options.directory, options.path);
        let data = options.data;
        const encoding = options.encoding;
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const now = Date.now();
        let ctime = now;
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (occupiedEntry && occupiedEntry.type === "directory")
          throw Error("The supplied path is a directory.");
        const parentEntry = await this.dbRequest("get", [parentPath]);
        if (parentEntry === void 0) {
          const subDirIndex = parentPath.indexOf("/", 1);
          if (subDirIndex !== -1) {
            const parentArgPath = parentPath.substr(subDirIndex);
            await this.mkdir({
              path: parentArgPath,
              directory: options.directory,
              recursive: true
            });
          }
        }
        if (!encoding && !this.isBase64String(data))
          throw Error("The supplied data is not valid base64 content.");
        if (occupiedEntry !== void 0) {
          if (occupiedEntry.content instanceof Blob) {
            throw Error("The occupied entry contains a Blob object which cannot be appended to.");
          }
          if (occupiedEntry.content !== void 0 && !encoding) {
            data = btoa(atob(occupiedEntry.content) + atob(data));
          } else {
            data = occupiedEntry.content + data;
          }
          ctime = occupiedEntry.ctime;
        }
        const pathObj = {
          path,
          folder: parentPath,
          type: "file",
          size: data.length,
          ctime,
          mtime: now,
          content: data
        };
        await this.dbRequest("put", [pathObj]);
      }
      /**
       * Delete a file from disk
       * @param options options for the file delete
       * @return a promise that resolves with the deleted file data result
       */
      async deleteFile(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (entry === void 0)
          throw Error("File does not exist.");
        const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
        if (entries.length !== 0)
          throw Error("Folder is not empty.");
        await this.dbRequest("delete", [path]);
      }
      /**
       * Create a directory.
       * @param options options for the mkdir
       * @return a promise that resolves with the mkdir result
       */
      async mkdir(options) {
        const path = this.getPath(options.directory, options.path);
        const doRecursive = options.recursive;
        const parentPath = path.substr(0, path.lastIndexOf("/"));
        const depth = (path.match(/\//g) || []).length;
        const parentEntry = await this.dbRequest("get", [parentPath]);
        const occupiedEntry = await this.dbRequest("get", [path]);
        if (depth === 1)
          throw Error("Cannot create Root directory");
        if (occupiedEntry !== void 0)
          throw Error("Current directory does already exist.");
        if (!doRecursive && depth !== 2 && parentEntry === void 0)
          throw Error("Parent directory must exist");
        if (doRecursive && depth !== 2 && parentEntry === void 0) {
          const parentArgPath = parentPath.substr(parentPath.indexOf("/", 1));
          await this.mkdir({
            path: parentArgPath,
            directory: options.directory,
            recursive: doRecursive
          });
        }
        const now = Date.now();
        const pathObj = {
          path,
          folder: parentPath,
          type: "directory",
          size: 0,
          ctime: now,
          mtime: now
        };
        await this.dbRequest("put", [pathObj]);
      }
      /**
       * Remove a directory
       * @param options the options for the directory remove
       */
      async rmdir(options) {
        const { path, directory, recursive } = options;
        const fullPath = this.getPath(directory, path);
        const entry = await this.dbRequest("get", [fullPath]);
        if (entry === void 0)
          throw Error("Folder does not exist.");
        if (entry.type !== "directory")
          throw Error("Requested path is not a directory");
        const readDirResult = await this.readdir({ path, directory });
        if (readDirResult.files.length !== 0 && !recursive)
          throw Error("Folder is not empty");
        for (const entry2 of readDirResult.files) {
          const entryPath = `${path}/${entry2.name}`;
          const entryObj = await this.stat({ path: entryPath, directory });
          if (entryObj.type === "file") {
            await this.deleteFile({ path: entryPath, directory });
          } else {
            await this.rmdir({ path: entryPath, directory, recursive });
          }
        }
        await this.dbRequest("delete", [fullPath]);
      }
      /**
       * Return a list of files from the directory (not recursive)
       * @param options the options for the readdir operation
       * @return a promise that resolves with the readdir directory listing result
       */
      async readdir(options) {
        const path = this.getPath(options.directory, options.path);
        const entry = await this.dbRequest("get", [path]);
        if (options.path !== "" && entry === void 0)
          throw Error("Folder does not exist.");
        const entries = await this.dbIndexRequest("by_folder", "getAllKeys", [IDBKeyRange.only(path)]);
        const files = await Promise.all(entries.map(async (e) => {
          let subEntry = await this.dbRequest("get", [e]);
          if (subEntry === void 0) {
            subEntry = await this.dbRequest("get", [e + "/"]);
          }
          return {
            name: e.substring(path.length + 1),
            type: subEntry.type,
            size: subEntry.size,
            ctime: subEntry.ctime,
            mtime: subEntry.mtime,
            uri: subEntry.path
          };
        }));
        return { files };
      }
      /**
       * Return full File URI for a path and directory
       * @param options the options for the stat operation
       * @return a promise that resolves with the file stat result
       */
      async getUri(options) {
        const path = this.getPath(options.directory, options.path);
        let entry = await this.dbRequest("get", [path]);
        if (entry === void 0) {
          entry = await this.dbRequest("get", [path + "/"]);
        }
        return {
          uri: (entry === null || entry === void 0 ? void 0 : entry.path) || path
        };
      }
      /**
       * Return data about a file
       * @param options the options for the stat operation
       * @return a promise that resolves with the file stat result
       */
      async stat(options) {
        const path = this.getPath(options.directory, options.path);
        let entry = await this.dbRequest("get", [path]);
        if (entry === void 0) {
          entry = await this.dbRequest("get", [path + "/"]);
        }
        if (entry === void 0)
          throw Error("Entry does not exist.");
        return {
          name: entry.path.substring(path.length + 1),
          type: entry.type,
          size: entry.size,
          ctime: entry.ctime,
          mtime: entry.mtime,
          uri: entry.path
        };
      }
      /**
       * Rename a file or directory
       * @param options the options for the rename operation
       * @return a promise that resolves with the rename result
       */
      async rename(options) {
        await this._copy(options, true);
        return;
      }
      /**
       * Copy a file or directory
       * @param options the options for the copy operation
       * @return a promise that resolves with the copy result
       */
      async copy(options) {
        return this._copy(options, false);
      }
      async requestPermissions() {
        return { publicStorage: "granted" };
      }
      async checkPermissions() {
        return { publicStorage: "granted" };
      }
      /**
       * Function that can perform a copy or a rename
       * @param options the options for the rename operation
       * @param doRename whether to perform a rename or copy operation
       * @return a promise that resolves with the result
       */
      async _copy(options, doRename = false) {
        let { toDirectory } = options;
        const { to, from, directory: fromDirectory } = options;
        if (!to || !from) {
          throw Error("Both to and from must be provided");
        }
        if (!toDirectory) {
          toDirectory = fromDirectory;
        }
        const fromPath = this.getPath(fromDirectory, from);
        const toPath = this.getPath(toDirectory, to);
        if (fromPath === toPath) {
          return {
            uri: toPath
          };
        }
        if (isPathParent(fromPath, toPath)) {
          throw Error("To path cannot contain the from path");
        }
        let toObj;
        try {
          toObj = await this.stat({
            path: to,
            directory: toDirectory
          });
        } catch (e) {
          const toPathComponents = to.split("/");
          toPathComponents.pop();
          const toPath2 = toPathComponents.join("/");
          if (toPathComponents.length > 0) {
            const toParentDirectory = await this.stat({
              path: toPath2,
              directory: toDirectory
            });
            if (toParentDirectory.type !== "directory") {
              throw new Error("Parent directory of the to path is a file");
            }
          }
        }
        if (toObj && toObj.type === "directory") {
          throw new Error("Cannot overwrite a directory with a file");
        }
        const fromObj = await this.stat({
          path: from,
          directory: fromDirectory
        });
        const updateTime = async (path, ctime2, mtime) => {
          const fullPath = this.getPath(toDirectory, path);
          const entry = await this.dbRequest("get", [fullPath]);
          entry.ctime = ctime2;
          entry.mtime = mtime;
          await this.dbRequest("put", [entry]);
        };
        const ctime = fromObj.ctime ? fromObj.ctime : Date.now();
        switch (fromObj.type) {
          // The "from" object is a file
          case "file": {
            const file = await this.readFile({
              path: from,
              directory: fromDirectory
            });
            if (doRename) {
              await this.deleteFile({
                path: from,
                directory: fromDirectory
              });
            }
            let encoding;
            if (!(file.data instanceof Blob) && !this.isBase64String(file.data)) {
              encoding = Encoding.UTF8;
            }
            const writeResult = await this.writeFile({
              path: to,
              directory: toDirectory,
              data: file.data,
              encoding
            });
            if (doRename) {
              await updateTime(to, ctime, fromObj.mtime);
            }
            return writeResult;
          }
          case "directory": {
            if (toObj) {
              throw Error("Cannot move a directory over an existing object");
            }
            try {
              await this.mkdir({
                path: to,
                directory: toDirectory,
                recursive: false
              });
              if (doRename) {
                await updateTime(to, ctime, fromObj.mtime);
              }
            } catch (e) {
            }
            const contents = (await this.readdir({
              path: from,
              directory: fromDirectory
            })).files;
            for (const filename of contents) {
              await this._copy({
                from: `${from}/${filename.name}`,
                to: `${to}/${filename.name}`,
                directory: fromDirectory,
                toDirectory
              }, doRename);
            }
            if (doRename) {
              await this.rmdir({
                path: from,
                directory: fromDirectory
              });
            }
          }
        }
        return {
          uri: toPath
        };
      }
      isBase64String(str) {
        try {
          return btoa(atob(str)) == str;
        } catch (err) {
          return false;
        }
      }
    };
    FilesystemWeb._debug = true;
  }
});

// node_modules/@capacitor/browser/dist/esm/web.js
var web_exports2 = {};
__export(web_exports2, {
  Browser: () => Browser,
  BrowserWeb: () => BrowserWeb
});
var BrowserWeb, Browser;
var init_web2 = __esm({
  "node_modules/@capacitor/browser/dist/esm/web.js"() {
    init_dist();
    BrowserWeb = class extends WebPlugin {
      constructor() {
        super();
        this._lastWindow = null;
      }
      async open(options) {
        this._lastWindow = window.open(options.url, options.windowName || "_blank");
      }
      async close() {
        return new Promise((resolve2, reject) => {
          if (this._lastWindow != null) {
            this._lastWindow.close();
            this._lastWindow = null;
            resolve2();
          } else {
            reject("No active window to close!");
          }
        });
      }
    };
    Browser = new BrowserWeb();
  }
});

// node_modules/@capacitor/local-notifications/dist/esm/web.js
var web_exports3 = {};
__export(web_exports3, {
  LocalNotificationsWeb: () => LocalNotificationsWeb
});
var LocalNotificationsWeb;
var init_web3 = __esm({
  "node_modules/@capacitor/local-notifications/dist/esm/web.js"() {
    init_dist();
    LocalNotificationsWeb = class extends WebPlugin {
      constructor() {
        super(...arguments);
        this.pending = [];
        this.deliveredNotifications = [];
        this.hasNotificationSupport = () => {
          if (!("Notification" in window) || !Notification.requestPermission) {
            return false;
          }
          if (Notification.permission !== "granted") {
            try {
              new Notification("");
            } catch (e) {
              if (e instanceof Error && e.name === "TypeError") {
                return false;
              }
            }
          }
          return true;
        };
      }
      async getDeliveredNotifications() {
        const deliveredSchemas = [];
        for (const notification of this.deliveredNotifications) {
          const deliveredSchema = {
            title: notification.title,
            id: parseInt(notification.tag),
            body: notification.body
          };
          deliveredSchemas.push(deliveredSchema);
        }
        return {
          notifications: deliveredSchemas
        };
      }
      async removeDeliveredNotifications(delivered) {
        for (const toRemove of delivered.notifications) {
          const found = this.deliveredNotifications.find((n) => n.tag === String(toRemove.id));
          found === null || found === void 0 ? void 0 : found.close();
          this.deliveredNotifications = this.deliveredNotifications.filter(() => !found);
        }
      }
      async removeDeliveredNotificationsById(options) {
        for (const id of options.ids) {
          const found = this.deliveredNotifications.find((n) => n.tag === String(id));
          found === null || found === void 0 ? void 0 : found.close();
          this.deliveredNotifications = this.deliveredNotifications.filter((n) => n !== found);
        }
      }
      async removeAllDeliveredNotifications() {
        for (const notification of this.deliveredNotifications) {
          notification.close();
        }
        this.deliveredNotifications = [];
      }
      async getByIds(options) {
        const ids = options.ids.map((id) => String(id));
        const scheduled = this.pending.filter((n) => ids.includes(String(n.id)));
        const delivered = this.deliveredNotifications.filter((n) => ids.includes(n.tag)).map((n) => this.deliveredToSchema(n));
        return { notifications: [...scheduled, ...delivered] };
      }
      async getAll(options) {
        const scheduled = [...this.pending];
        const delivered = this.deliveredNotifications.map((n) => this.deliveredToSchema(n));
        if ((options === null || options === void 0 ? void 0 : options.state) === "SCHEDULED") {
          return { notifications: scheduled };
        }
        if ((options === null || options === void 0 ? void 0 : options.state) === "TRIGGERED") {
          return { notifications: delivered };
        }
        return { notifications: [...scheduled, ...delivered] };
      }
      deliveredToSchema(notification) {
        return {
          title: notification.title,
          id: parseInt(notification.tag),
          body: notification.body
        };
      }
      async createChannel() {
        throw this.unimplemented("Not implemented on web.");
      }
      async deleteChannel() {
        throw this.unimplemented("Not implemented on web.");
      }
      async listChannels() {
        throw this.unimplemented("Not implemented on web.");
      }
      async schedule(options) {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        for (const notification of options.notifications) {
          this.sendNotification(notification);
        }
        return {
          notifications: options.notifications.map((notification) => ({
            id: notification.id
          }))
        };
      }
      async update(options) {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        const updated = [];
        for (const notification of options.notifications) {
          const index = this.pending.findIndex((n) => n.id === notification.id);
          if (index === -1) {
            continue;
          }
          this.pending.splice(index, 1);
          this.sendNotification(notification);
          updated.push(notification);
        }
        return {
          notifications: updated.map((notification) => ({ id: notification.id }))
        };
      }
      async getPending() {
        return {
          notifications: this.pending
        };
      }
      async cancelAll() {
        this.pending = [];
      }
      async registerActionTypes() {
        throw this.unimplemented("Not implemented on web.");
      }
      async cancel(pending) {
        this.pending = this.pending.filter((notification) => !pending.notifications.find((n) => n.id === notification.id));
      }
      async areEnabled() {
        const { display } = await this.checkPermissions();
        return {
          value: display === "granted"
        };
      }
      async changeExactNotificationSetting() {
        throw this.unimplemented("Not implemented on web.");
      }
      async checkExactNotificationSetting() {
        throw this.unimplemented("Not implemented on web.");
      }
      async requestPermissions() {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        const display = this.transformNotificationPermission(await Notification.requestPermission());
        return { display };
      }
      async checkPermissions() {
        if (!this.hasNotificationSupport()) {
          throw this.unavailable("Notifications not supported in this browser.");
        }
        const display = this.transformNotificationPermission(Notification.permission);
        return { display };
      }
      transformNotificationPermission(permission) {
        switch (permission) {
          case "granted":
            return "granted";
          case "denied":
            return "denied";
          default:
            return "prompt";
        }
      }
      sendPending() {
        var _a;
        const toRemove = [];
        const now = (/* @__PURE__ */ new Date()).getTime();
        for (const notification of this.pending) {
          if (((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) && notification.schedule.at.getTime() <= now) {
            this.buildNotification(notification);
            toRemove.push(notification);
          }
        }
        this.pending = this.pending.filter((notification) => !toRemove.find((n) => n === notification));
      }
      sendNotification(notification) {
        var _a;
        if ((_a = notification.schedule) === null || _a === void 0 ? void 0 : _a.at) {
          const diff = notification.schedule.at.getTime() - (/* @__PURE__ */ new Date()).getTime();
          this.pending.push(notification);
          setTimeout(() => {
            this.sendPending();
          }, diff);
          return;
        }
        this.buildNotification(notification);
      }
      buildNotification(notification) {
        const localNotification = new Notification(notification.title, {
          body: notification.body,
          tag: String(notification.id)
        });
        localNotification.addEventListener("click", this.onClick.bind(this, notification), false);
        localNotification.addEventListener("show", this.onShow.bind(this, notification), false);
        localNotification.addEventListener("close", () => {
          this.deliveredNotifications = this.deliveredNotifications.filter(() => !this);
        }, false);
        this.deliveredNotifications.push(localNotification);
        return localNotification;
      }
      onClick(notification) {
        const data = {
          actionId: "tap",
          notification
        };
        this.notifyListeners("localNotificationActionPerformed", data);
      }
      onShow(notification) {
        this.notifyListeners("localNotificationReceived", notification);
      }
    };
  }
});

// node_modules/@capacitor/motion/dist/esm/web.js
var web_exports4 = {};
__export(web_exports4, {
  MotionWeb: () => MotionWeb
});
var MotionWeb;
var init_web4 = __esm({
  "node_modules/@capacitor/motion/dist/esm/web.js"() {
    init_dist();
    MotionWeb = class extends WebPlugin {
      constructor() {
        super();
        this.registerWindowListener("devicemotion", "accel");
        this.registerWindowListener("deviceorientation", "orientation");
      }
    };
  }
});

// node_modules/@capacitor/share/dist/esm/web.js
var web_exports5 = {};
__export(web_exports5, {
  ShareWeb: () => ShareWeb
});
var ShareWeb;
var init_web5 = __esm({
  "node_modules/@capacitor/share/dist/esm/web.js"() {
    init_dist();
    ShareWeb = class extends WebPlugin {
      async canShare() {
        if (typeof navigator === "undefined" || !navigator.share) {
          return { value: false };
        } else {
          return { value: true };
        }
      }
      async share(options) {
        if (typeof navigator === "undefined" || !navigator.share) {
          throw this.unavailable("Share API not available in this browser");
        }
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url
        });
        return {};
      }
    };
  }
});

// node_modules/@capacitor/filesystem/dist/esm/index.js
init_dist();

// node_modules/@capacitor/synapse/dist/synapse.mjs
function s(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return new Proxy({}, {
          get(w, o) {
            return (c, p, r) => {
              const i = t.Capacitor.Plugins[n];
              if (i === void 0) {
                r(new Error(`Capacitor plugin ${n} not found`));
                return;
              }
              if (typeof i[o] != "function") {
                r(new Error(`Method ${o} not found in Capacitor plugin ${n}`));
                return;
              }
              (async () => {
                try {
                  const a = await i[o](c);
                  p(a);
                } catch (a) {
                  r(a);
                }
              })();
            };
          }
        });
      }
    }
  );
}
function u(t) {
  t.CapacitorUtils.Synapse = new Proxy(
    {},
    {
      get(e, n) {
        return t.cordova.plugins[n];
      }
    }
  );
}
function f(t = false) {
  typeof window > "u" || (window.CapacitorUtils = window.CapacitorUtils || {}, window.Capacitor !== void 0 && !t ? s(window) : window.cordova !== void 0 && u(window));
}

// node_modules/@capacitor/filesystem/dist/esm/index.js
init_definitions();
var Filesystem = registerPlugin("Filesystem", {
  web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.FilesystemWeb())
});
f();

// node_modules/@capacitor/browser/dist/esm/index.js
init_dist();
var Browser2 = registerPlugin("Browser", {
  web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.BrowserWeb())
});

// node_modules/@capacitor/local-notifications/dist/esm/index.js
init_dist();

// node_modules/@capacitor/local-notifications/dist/esm/definitions.js
var Weekday;
(function(Weekday2) {
  Weekday2[Weekday2["Sunday"] = 1] = "Sunday";
  Weekday2[Weekday2["Monday"] = 2] = "Monday";
  Weekday2[Weekday2["Tuesday"] = 3] = "Tuesday";
  Weekday2[Weekday2["Wednesday"] = 4] = "Wednesday";
  Weekday2[Weekday2["Thursday"] = 5] = "Thursday";
  Weekday2[Weekday2["Friday"] = 6] = "Friday";
  Weekday2[Weekday2["Saturday"] = 7] = "Saturday";
})(Weekday || (Weekday = {}));

// node_modules/@capacitor/local-notifications/dist/esm/index.js
var LocalNotifications = registerPlugin("LocalNotifications", {
  web: () => Promise.resolve().then(() => (init_web3(), web_exports3)).then((m) => new m.LocalNotificationsWeb())
});

// node_modules/@capacitor/motion/dist/esm/index.js
init_dist();
var Motion = registerPlugin("Motion", {
  android: () => Promise.resolve().then(() => (init_web4(), web_exports4)).then((m) => new m.MotionWeb()),
  ios: () => Promise.resolve().then(() => (init_web4(), web_exports4)).then((m) => new m.MotionWeb()),
  web: () => Promise.resolve().then(() => (init_web4(), web_exports4)).then((m) => new m.MotionWeb())
});

// node_modules/@capacitor/share/dist/esm/index.js
init_dist();
var Share = registerPlugin("Share", {
  web: () => Promise.resolve().then(() => (init_web5(), web_exports5)).then((m) => new m.ShareWeb())
});

// app.js
init_dist();
var capacitor = window.Capacitor || (window.Capacitor = {});
capacitor.Plugins = {
  ...capacitor.Plugins || {},
  Browser: Browser2,
  Filesystem,
  LocalNotifications,
  Motion,
  Share,
  CapacitorGameConnect: registerPlugin("CapacitorGameConnect")
};
(() => {
  const cv = document.getElementById("game");
  const ctx = cv.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const I18N = {
    ja: {
      "tap": "\u30BF\u30C3\u30D7\u3057\u3066\u306F\u3058\u3081\u308B",
      "a.pause": "\u4E00\u6642\u505C\u6B62",
      "a.coins": "Cosmo Coin\uFF08\u304D\u305B\u304B\u3048\u3078\uFF09",
      "a.howto": "\u904A\u3073\u65B9",
      "a.back": "\u30BF\u30A4\u30C8\u30EB\u3078\u3082\u3069\u308B",
      "close": "\u3068\u3058\u308B",
      "m.mission": "\u30C7\u30A4\u30EA\u30FC<br>\u30DF\u30C3\u30B7\u30E7\u30F3",
      "m.shop": "\u30B7\u30E7\u30C3\u30D7<br>\u30AD\u30E3\u30E9\u30FB\u304D\u305B\u304B\u3048",
      "m.zukan": "\u30B3\u30EC\u30AF\u30B7\u30E7\u30F3<br>\u305A\u304B\u3093",
      "m.sns": "SNS\u30FB<br>LINE\u30B9\u30BF\u30F3\u30D7",
      "map.sub": "\u30CD\u30AE\u306E\u540D\u7523\u770C\u3092\u3081\u3050\u308D\u3046",
      "zk.head": "ZUKAN",
      "zk.sub": "\u30B3\u30EC\u30AF\u30B7\u30E7\u30F3\u305A\u304B\u3093",
      "zk.chars": "\u30CD\u30AE\u306E\u306A\u304B\u307E",
      "zk.prefs": "\u3081\u3050\u3063\u305F\u770C",
      "zk.notyet": "\u307E\u3060\u898B\u3064\u3051\u3066\u3044\u306A\u3044",
      "zk.clearToAdd": "\u30AF\u30EA\u30A2\u3059\u308B\u3068\u767B\u9332",
      "sns.title": "SNS\u30FBLINE\u30B9\u30BF\u30F3\u30D7",
      "claim": "\u3046\u3051\u3068\u308B",
      "claimed": "\u3046\u3051\u3068\u308A\u6E08",
      "notyet": "\u307E\u3060",
      "sound.on": "\u97F3\u58F0\uFF1AON",
      "sound.off": "\u97F3\u58F0\uFF1AOFF",
      "ms.title": "\u304D\u3087\u3046\u306E\u30DF\u30C3\u30B7\u30E7\u30F3",
      "ms.note": "\u30DF\u30C3\u30B7\u30E7\u30F3\u306F\u6BCE\u65E50\u6642\u306B\u5165\u308C\u304B\u308F\u308B\u3088",
      "ms.done": "\u30DF\u30C3\u30B7\u30E7\u30F3\u9054\u6210\uFF01",
      "ms.bonusGot": "\u305C\u3093\u3076\u9054\u6210\u30DC\u30FC\u30CA\u30B9 \u3046\u3051\u3068\u308A\u6E08\u307F\uFF01\u307E\u305F\u660E\u65E5\u306D",
      "ms.bonusBtn": "\u305C\u3093\u3076\u9054\u6210\uFF01 +{n}",
      "ms.bonusHint": "3\u3064\u305C\u3093\u3076\u9054\u6210\u3059\u308B\u3068 +{n} Cosmo Coin",
      "shop.title": "\u30B7\u30E7\u30C3\u30D7",
      "shop.chars": "\u30AD\u30E3\u30E9",
      "shop.dress": "\u304D\u305B\u304B\u3048",
      "zk.cosmii": "Cosmii\u306E\u306A\u304B\u307E",
      "cs.sub": "\u3044\u3063\u3057\u3087\u306B\u884C\u304FCosmii\u3092\u3048\u3089\u307C\u3046",
      "cs.go": "\u3053\u306E\u30AD\u30E3\u30E9\u3067\u884C\u304F",
      "cs.shop": "\u30B7\u30E7\u30C3\u30D7\u3067\u8CB7\u3046",
      "cs.locked": "\u30B7\u30E7\u30C3\u30D7\u3067 {n} Cosmo Coin \u3067\u624B\u306B\u5165\u308B\u3088",
      "f.guard": "\u30AC\u30FC\u30C9\uFF01",
      "nt.title": "\u304A\u77E5\u3089\u305B\u3092\u53D7\u3051\u3068\u308B\uFF1F",
      "nt.body": "\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u3084\u65B0\u3057\u3044\u30DF\u30C3\u30B7\u30E7\u30F3\u3092<br>Cosmii\u304C\u304A\u77E5\u3089\u305B\u3059\u308B\u3088<br><small>PC\u30D6\u30E9\u30A6\u30B6\u30FC\u3067\u306F\u30A2\u30D7\u30EA\u3092\u958B\u3044\u3066\u3044\u308B\u9593\u306B\u901A\u77E5\u3055\u308C\u307E\u3059</small>",
      "nt.yes": "ON\u306B\u3059\u308B",
      "nt.no": "\u3042\u3068\u3067",
      "nt.on": "\u901A\u77E5\uFF1AON",
      "nt.off": "\u901A\u77E5\uFF1AOFF",
      "nt.denied": "\u901A\u77E5\u304C\u8A31\u53EF\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u30D6\u30E9\u30A6\u30B6\u30FC\u307E\u305F\u306F\u7AEF\u672B\u306E\u8A2D\u5B9A\u304B\u3089ON\u306B\u3067\u304D\u307E\u3059",
      "shop.hats": "\u307C\u3046\u3057",
      "shop.baskets": "\u30AB\u30B4",
      "shop.hint": "\u30CD\u30AE\u3092\u30AD\u30E3\u30C3\u30C1\u3057\u3066Cosmo Coin\u3092\u305F\u3081\u3088\u3046",
      "shop.on": "\u305D\u3046\u3073\u4E2D",
      "shop.owned": "\u3082\u3063\u3066\u308B",
      "shop.short": "Cosmo Coin\u304C\u3042\u3068{n}\u305F\u308A\u306A\u3044\u3088",
      "shop.wear": "{name}\u306B\u304D\u304C\u3048\u305F\u3088",
      "shop.got": "{name}\u3092\u30B2\u30C3\u30C8\uFF01",
      "howto.title": "\u904A\u3073\u65B9",
      "ok": "OK",
      "r.negi": "<b>\u30CD\u30AE</b>\u30AD\u30E3\u30C3\u30C1\uFF01",
      "r.gold": "<b>\u91D1\u306E\u30CD\u30AE</b>3\u672C\u3076\u3093",
      "r.rot": '<b style="color:var(--danger)">\u8150\u3063\u305F\u30CD\u30AE</b>\u53D6\u308B\u3068\u2665-1',
      "howto.text": "\u30B9\u30DE\u30DB\u3092\u5DE6\u53F3\u306B\u50BE\u3051\u3066Cosmii\u3092\u52D5\u304B\u305D\u3046\u3002<br>\u6307\u3067\u30C9\u30E9\u30C3\u30B0\u3057\u3066\u3082\u52D5\u3051\u308B\u3088\u3002<br>\u30CD\u30AE\u3092\u843D\u3068\u3057\u3066\u3082\u2665\u304C1\u3064\u6E1B\u308B\u3088\u3002<br>\u30CE\u30FC\u30DF\u30B9\u3067\u30AF\u30EA\u30A2\u3059\u308B\u3068\u26053\uFF01",
      "pause.title": "\u3072\u3068\u3084\u3059\u307F",
      "resume": "\u3064\u3065\u3051\u308B",
      "retry": "\u3084\u308A\u306A\u304A\u3059",
      "quit": "\u3084\u3081\u308B",
      "next": "\u3064\u304E\u3078",
      "again": "\u3082\u3046\u4E00\u56DE",
      "map": "\u30DE\u30C3\u30D7",
      "share": "\u7D50\u679C\u3092\u30B7\u30A7\u30A2",
      "back": "\u3082\u3069\u308B",
      "coin": "Cosmo Coin",
      "login.title": "{n}\u65E5\u76EE\u306E\u30ED\u30B0\u30A4\u30F3\uFF01",
      "login.big": "7\u65E5\u9593\u304A\u3064\u304B\u308C\u3055\u307E\uFF01\u5927\u30DC\u30FC\u30CA\u30B9100 Cosmo Coin\uFF01",
      "login.msg": "\u304D\u3087\u3046\u306F {n} Cosmo Coin\u30027\u65E5\u76EE\u306F100\uFF01",
      "login.bonus": "\u30DC\u30FC\u30CA\u30B9\uFF01",
      "goal": "\u30CD\u30AE\u3092{n}\u672C\u30AD\u30E3\u30C3\u30C1",
      "endless.intro": "\u2605\u304B\u3089\u65E5\u672C\u3058\u3085\u3046\u306E\u30CD\u30AE\u7551\u3078\uFF01",
      "best": "\u30D9\u30B9\u30C8 {n}",
      "arrive": "{sub}\u306B\u5230\u7740\uFF01",
      "clear": "\u30AF\u30EA\u30A2\uFF01",
      "kingDown": "\u30CD\u30AE\u5927\u738B\u3092\u305F\u304A\u3057\u305F\uFF01",
      "perfect": "\u30CE\u30FC\u30DF\u30B9\uFF01\u304B\u3093\u307A\u304D\uFF01",
      "lostHearts": "\u2665\u3092{n}\u3064\u5931\u3063\u305F\u3088\u3002\u30CE\u30FC\u30DF\u30B9\u3067\u26053",
      "endlessOpen": "\u30A8\u30F3\u30C9\u30EC\u30B9\u30E2\u30FC\u30C9\u304C\u89E3\u653E\u3055\u308C\u305F\u3088\uFF01",
      "allDone": "\u305C\u3093\u3076\u306E\u770C\u3092\u3081\u3050\u3063\u305F\u306D\uFF01\u26053\u30B3\u30F3\u30D7\u30EA\u30FC\u30C8\u3092\u3081\u3056\u305D\u3046",
      "earnClear": '+{n} Cosmo Coin <small style="font-weight:700;color:var(--brown-soft)">\uFF08\u30AF\u30EA\u30A2\u30DC\u30FC\u30CA\u30B9{b}\uFF09</small>',
      "earn": "+{n} Cosmo Coin",
      "gameover": "\u30B2\u30FC\u30E0\u30AA\u30FC\u30D0\u30FC",
      "newBest": "\u30D9\u30B9\u30C8\u66F4\u65B0\uFF01\u3000",
      "miss": "\u3056\u3093\u306D\u3093\u2026",
      "close3": "\u3042\u3068{n}\u672C\u3060\u3063\u305F\uFF01\u304A\u3057\u3044\uFF01",
      "leftN": "\u3042\u3068{n}\u672C\u3002\u3082\u3046\u4E00\u56DE\u3044\u3063\u3066\u307F\u3088\u3046",
      "endlessLock": "\u30B9\u30C6\u30FC\u30B83\u30AF\u30EA\u30A2\u3067\u89E3\u653E",
      "stageAria": "\u30B9\u30C6\u30FC\u30B8{n} {name} \u661F{s}",
      "lockedAria": "\u30B9\u30C6\u30FC\u30B8{n} \u672A\u958B\u653E",
      "chipGoal": "\u30CD\u30AE {n}\u672C\u30AD\u30E3\u30C3\u30C1",
      "tilt.on": "\u50BE\u304D\u64CD\u4F5CON\u3002\u30BF\u30C3\u30D7\u3067\u4ECA\u306E\u89D2\u5EA6\u3092\u307E\u3063\u3059\u3050\u306B\u3057\u307E\u3059",
      "tilt.denied": "\u50BE\u304D\u306E\u8A31\u53EF\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u6307\u3067\u30C9\u30E9\u30C3\u30B0\u3057\u3066\u904A\u3079\u307E\u3059",
      "tilt.err": "\u50BE\u304D\u306E\u8A31\u53EF\u3092\u53D6\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u6307\u3067\u30C9\u30E9\u30C3\u30B0\u3057\u3066\u904A\u3079\u307E\u3059",
      "tilt.none": "\u3053\u3053\u3067\u306F\u50BE\u304D\u3092\u8AAD\u307F\u53D6\u308C\u307E\u305B\u3093\u3002\u6307\u3067\u30C9\u30E9\u30C3\u30B0\u3057\u3066\u904A\u3079\u307E\u3059",
      "tilt.reset": "\u4ECA\u306E\u89D2\u5EA6\u3092\u300C\u307E\u3063\u3059\u3050\u300D\u306B\u3057\u307E\u3057\u305F",
      "tilt.off": "\u50BE\u304D\u64CD\u4F5C\u3092ON\u306B\u3059\u308B",
      "f.rot": "\u304F\u3055\u3063\uFF01",
      "f.drop": "\u304A\u3068\u3057\u305F\u2026",
      "sh.clear": "\u30B9\u30C6\u30FC\u30B8{n}\u300C{name}\u300D\u3092{st}\u3067\u30AF\u30EA\u30A2\uFF01",
      "sh.king": "\u30CD\u30AE\u5927\u738B\u3092\u305F\u304A\u3057\u305F\uFF01{st}",
      "sh.endless": "\u30A8\u30F3\u30C9\u30EC\u30B9\u3067{n}\u70B9\u3001{area}\u307E\u3067\u305F\u3069\u308A\u3064\u3044\u305F\uFF01{best}\n\u3053\u306E\u30B9\u30B3\u30A2\u3001\u3053\u3048\u3089\u308C\u308B\uFF1F",
      "sh.best": "\uFF08\u30D9\u30B9\u30C8\u66F4\u65B0\uFF09",
      "sh.fail": "\u30B9\u30C6\u30FC\u30B8{n}\u300C{name}\u300D\u2026\u3042\u3068{left}\u672C\u3060\u3063\u305F\uFF01",
      "sh.title": "\u7D50\u679C\u3092\u30B7\u30A7\u30A2",
      "sh.copied": "\u30B7\u30A7\u30A2\u6587\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F",
      "sh.cant": "\u3053\u306E\u74B0\u5883\u3067\u306F\u30B7\u30A7\u30A2\u3067\u304D\u307E\u305B\u3093",
      "share.x": "X\u3067\u6295\u7A3F",
      "rank.error": "\u30E9\u30F3\u30AD\u30F3\u30B0\u3092\u958B\u3051\u307E\u305B\u3093\u3002Game Center\u306E\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      "img.endless": "\u30A8\u30F3\u30C9\u30EC\u30B9\u3000{area}\u307E\u3067\u5230\u9054",
      "img.pts": "{n}\u70B9",
      "img.left": "\u3042\u3068{n}\u672C\uFF01"
    },
    en: {
      "tap": "TAP TO START",
      "a.pause": "Pause",
      "a.coins": "Cosmo Coin (Dress Up)",
      "a.howto": "How to play",
      "a.back": "Back to title",
      "close": "Close",
      "m.mission": "Daily<br>Missions",
      "m.shop": "Shop<br>Characters",
      "m.zukan": "Collection<br>Book",
      "m.sns": "SNS &amp;<br>LINE Stickers",
      "map.sub": "Tour Japan's negi country",
      "zk.head": "COLLECTION",
      "zk.sub": "Collection Book",
      "zk.chars": "Negi Friends",
      "zk.prefs": "Prefectures Visited",
      "zk.notyet": "Not found yet",
      "zk.clearToAdd": "Clear to add",
      "sns.title": "SNS & LINE Stickers",
      "claim": "Claim",
      "claimed": "Claimed",
      "notyet": "Not yet",
      "sound.on": "Sound: on",
      "sound.off": "Sound: off",
      "ms.title": "Today's Missions",
      "ms.note": "New missions every day at midnight",
      "ms.done": "Mission complete!",
      "ms.bonusGot": "All-clear bonus claimed! See you tomorrow",
      "ms.bonusBtn": "All done! +{n}",
      "ms.bonusHint": "Finish all 3 for +{n} Cosmo Coin",
      "shop.title": "Shop",
      "shop.chars": "Characters",
      "shop.dress": "Dress Up",
      "zk.cosmii": "Cosmii Friends",
      "cs.sub": "Pick a Cosmii to bring along",
      "cs.go": "Go with this one",
      "cs.shop": "Get it in the shop",
      "cs.locked": "Available in the shop for {n} Cosmo Coin",
      "f.guard": "Blocked!",
      "nt.title": "Get reminders?",
      "nt.body": "Cosmii will let you know when your<br>login bonus and new missions are ready<br><small>On desktop browsers, reminders work while the app is open</small>",
      "nt.yes": "Turn on",
      "nt.no": "Not now",
      "nt.on": "Notifications: on",
      "nt.off": "Notifications: off",
      "nt.denied": "Notifications are blocked. Check your browser or device settings",
      "shop.hats": "Hats",
      "shop.baskets": "Baskets",
      "shop.hint": "Catch negi to earn Cosmo Coin",
      "shop.on": "Wearing",
      "shop.owned": "Owned",
      "shop.short": "You need {n} more Cosmo Coin",
      "shop.wear": "Now wearing {name}",
      "shop.got": "Got {name}!",
      "howto.title": "How to Play",
      "ok": "OK",
      "r.negi": "<b>Negi</b>Catch it!",
      "r.gold": "<b>Golden Negi</b>Counts as 3",
      "r.rot": '<b style="color:var(--danger)">Rotten Negi</b>Lose a \u2665',
      "howto.text": "Tilt your phone left and right to move Cosmii.<br>You can also drag with your finger.<br>Dropping a negi costs a \u2665.<br>Clear with no misses for \u26053!",
      "pause.title": "Paused",
      "resume": "Resume",
      "retry": "Restart",
      "quit": "Quit",
      "next": "Next",
      "again": "Try again",
      "map": "Map",
      "share": "Share result",
      "back": "Back",
      "coin": "Cosmo Coin",
      "login.title": "Day {n} login!",
      "login.big": "A full week! Big bonus: 100 Cosmo Coin!",
      "login.msg": "Today's reward: {n} Cosmo Coin. Day 7 gives 100!",
      "login.bonus": "Bonus!",
      "goal": "Catch {n} negi",
      "endless.intro": "From the stars across all of Japan!",
      "best": "Best {n}",
      "arrive": "Arrived: {sub}!",
      "clear": "Clear!",
      "kingDown": "You beat the Negi King!",
      "perfect": "No misses. Perfect!",
      "lostHearts": "You lost {n} \u2665. Clear with no misses for \u26053",
      "endlessOpen": "Endless mode unlocked!",
      "allDone": "You visited every prefecture! Now go for \u26053 on all",
      "earnClear": '+{n} Cosmo Coin <small style="font-weight:700;color:var(--brown-soft)">(clear bonus {b})</small>',
      "earn": "+{n} Cosmo Coin",
      "gameover": "Game Over",
      "newBest": "New best! ",
      "miss": "So close\u2026",
      "close3": "Only {n} to go. So close!",
      "leftN": "{n} to go. Give it another try",
      "endlessLock": "Clear stage 3 to unlock",
      "stageAria": "Stage {n} {name}, {s} stars",
      "lockedAria": "Stage {n} locked",
      "chipGoal": "Catch {n} negi",
      "tilt.on": "Tilt is on. Tap to set the current angle as level",
      "tilt.denied": "Tilt permission denied. You can drag with your finger",
      "tilt.err": "Could not get tilt permission. You can drag with your finger",
      "tilt.none": "Tilt is not available here. You can drag with your finger",
      "tilt.reset": "Current angle set as level",
      "tilt.off": "Turn on tilt controls",
      "f.rot": "Yuck!",
      "f.drop": "Dropped\u2026",
      "sh.clear": 'Cleared Stage {n} "{name}" with {st}!',
      "sh.king": "I beat the Negi King! {st}",
      "sh.endless": "Scored {n} in Endless and made it to {area}!{best}\nCan you beat it?",
      "sh.best": " (new best)",
      "sh.fail": 'Stage {n} "{name}"\u2026 only {left} to go!',
      "sh.title": "Share result",
      "sh.copied": "Share text copied",
      "sh.cant": "Sharing is not available here",
      "share.x": "Post to X",
      "rank.error": "Could not open the leaderboard. Check Game Center setup.",
      "img.endless": "Endless: reached {area}",
      "img.pts": "{n} pts",
      "img.left": "{n} to go!"
    }
  };
  let LANG = "ja";
  const tr = (k, p = {}) => String(I18N[LANG][k] ?? I18N.ja[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => p[n] ?? "");
  const L = (obj, field) => LANG === "en" && obj.en && obj.en[field] != null ? obj.en[field] : obj[field];
  const COIN_IMG = "./img/cosmo-coin.png";
  const COIN_IC = COIN_IMG ? `<img class="coin-ic" src="${COIN_IMG}" alt="">` : '<svg class="coin-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#ffd84a" stroke="#cf9620" stroke-width="2"/><circle cx="12" cy="12" r="7" fill="none" stroke="#f0b72a" stroke-width="1.4"/><path d="M12 6.6l1.5 3.6 3.9.3-3 2.5.9 3.8L12 14.8l-3.3 2 .9-3.8-3-2.5 3.9-.3z" fill="#fff6c8" stroke="#cf9620" stroke-width=".8" stroke-linejoin="round"/></svg>';
  function applyI18n() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.innerHTML = tr(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", tr(el.dataset.i18nAria));
    });
    document.querySelectorAll(".coin-slot").forEach((el) => {
      el.innerHTML = COIN_IC;
    });
  }
  let audioContext = null;
  function playSound(kind) {
    if (!save.sound) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext ||= new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume().catch((e) => console.error("Could not resume game audio", e));
    const notes = {
      catch: [660],
      gold: [660, 880],
      miss: [280],
      clear: [523, 659, 784],
      over: [392, 330, 262]
    }[kind];
    if (!notes) return;
    const start = audioContext.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const begins = start + index * 0.11;
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(1e-4, begins);
      gain.gain.exponentialRampToValueAtTime(0.12, begins + 0.015);
      gain.gain.exponentialRampToValueAtTime(1e-4, begins + 0.16);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(begins);
      oscillator.stop(begins + 0.17);
    });
  }
  function updateSoundBtn() {
    const button = $("soundBtn");
    const label = tr(save.sound ? "sound.on" : "sound.off");
    button.classList.toggle("on", save.sound);
    button.setAttribute("aria-label", label);
    button.title = label;
  }
  const bgm = new Audio();
  bgm.preload = "auto";
  bgm.volume = 0.35;
  bgm.setAttribute("playsinline", "");
  const bgmTracks = ["./audio/\u5C0F\u3055\u306A\u661F.mp3", "./audio/littlestar.mp3"];
  let bgmStarted = false, bgmPaused = false, bgmTrackIndex = 0;
  function playNextBgm() {
    const track = bgmTracks[bgmTrackIndex];
    bgmTrackIndex = (bgmTrackIndex + 1) % bgmTracks.length;
    bgm.src = track;
    bgm.load();
    bgm.play().catch((e) => console.error("Could not play background music", e));
  }
  bgm.addEventListener("ended", () => {
    if (bgmStarted && save.sound && !bgmPaused) playNextBgm();
  });
  function updateBgm() {
    if (!bgmStarted || !save.sound || bgmPaused) {
      bgm.pause();
      return;
    }
    if (!bgm.src) playNextBgm();
    else bgm.play().catch((e) => console.error("Could not play background music", e));
  }
  function startBgm() {
    bgmStarted = true;
    bgmPaused = false;
    updateBgm();
  }
  function stopBgm() {
    bgmStarted = false;
    bgmPaused = false;
    bgm.pause();
    bgm.removeAttribute("src");
    bgm.load();
    bgmTrackIndex = 0;
  }
  const STAGES = [
    {
      name: "\u8328\u57CE\u770C",
      sub: "\u306F\u3058\u307E\u308A\u306E\u30CD\u30AE\u7551",
      goal: 10,
      speed: [140, 190],
      gap: [1.1, 0.95],
      rot: 0,
      gold: 0,
      sky: ["#0d1030", "#24215a"],
      ground: "#2f5a2c",
      crater: "#244722",
      orb: "#f3e6b0",
      intro: "\u307E\u305A\u306F\u6163\u308C\u3088\u3046\u3002\u30CD\u30AE\u309210\u672C\u30AD\u30E3\u30C3\u30C1\uFF01"
    },
    {
      name: "\u5343\u8449\u770C",
      sub: "\u30CD\u30AE\u7551\u304C\u3069\u3053\u307E\u3067\u3082",
      goal: 15,
      speed: [160, 220],
      gap: [1, 0.85],
      rot: 0.18,
      gold: 0,
      sky: ["#0d1030", "#2a1a52"],
      ground: "#355f2a",
      crater: "#284a20",
      orb: "#f3e6b0",
      newThing: "NEW \u8150\u3063\u305F\u30CD\u30AE\u304C\u51FA\u3066\u304F\u308B\u3088"
    },
    {
      name: "\u9CE5\u53D6\u770C",
      sub: "\u7802\u4E18\u306E\u767D\u30CD\u30AE",
      goal: 20,
      speed: [170, 250],
      gap: [0.95, 0.75],
      rot: 0.18,
      gold: 0.06,
      sky: ["#2a1630", "#6a3a3a"],
      ground: "#c9a46a",
      crater: "#a8854f",
      orb: "#ffd9a0",
      newThing: "NEW \u91D1\u306E\u30CD\u30AE\u306F3\u672C\u3076\u3093\uFF01"
    },
    {
      name: "\u7FA4\u99AC\u770C",
      sub: "\u304B\u3089\u3063\u98A8\u304C\u5439\u304F",
      goal: 22,
      speed: [190, 270],
      gap: [0.9, 0.7],
      rot: 0.2,
      gold: 0.06,
      sky: ["#1a1838", "#4a3a5e"],
      ground: "#4a5a2a",
      crater: "#3a4820",
      orb: "#f8eecb",
      wind: 70,
      newThing: "NEW \u304B\u3089\u3063\u98A8\u3067\u30CD\u30AE\u304C\u6D41\u3055\u308C\u308B"
    },
    {
      name: "\u798F\u5CA1\u770C",
      sub: "\u7D30\u30CD\u30AE\u304C\u3075\u3063\u3066\u304F\u308B",
      goal: 25,
      speed: [200, 280],
      gap: [0.85, 0.65],
      rot: 0.22,
      gold: 0.06,
      sky: ["#14183a", "#3b2f5e"],
      ground: "#2f6a3a",
      crater: "#24532d",
      orb: "#f3e6b0",
      double: 0.25,
      newThing: "NEW 2\u672C\u540C\u6642\u306B\u843D\u3061\u3066\u304F\u308B"
    },
    {
      name: "\u79CB\u7530\u770C",
      sub: "\u96EA\u306E\u4E0B\u306E\u30CD\u30AE\u7551",
      goal: 25,
      speed: [190, 270],
      gap: [0.85, 0.7],
      rot: 0.22,
      gold: 0.06,
      sky: ["#071a2e", "#16466a"],
      ground: "#dceefa",
      crater: "#b8d6ea",
      orb: "#e6f7ff",
      ice: true,
      newThing: "NEW \u96EA\u3067\u5730\u9762\u304C\u30C4\u30EB\u30C4\u30EB\u3059\u3079\u308B"
    },
    { name: "\u5C71\u5F62\u770C", sub: "\u5439\u96EA\u306E\u591C", goal: 28, speed: [210, 300], gap: [0.8, 0.62], rot: 0.24, gold: 0.06, sky: ["#0a2236", "#285a80"], ground: "#e8f4fb", crater: "#c4def0", orb: "#ffffff", ice: true, wind: 60 },
    {
      name: "\u5BAE\u57CE\u770C",
      sub: "\u3064\u3080\u3058\u98A8\u306E\u30CD\u30AE\u7551",
      goal: 28,
      speed: [200, 280],
      gap: [0.85, 0.65],
      rot: 0.24,
      gold: 0.07,
      sky: ["#0b1424", "#22364a"],
      ground: "#3a5a32",
      crater: "#2c4626",
      orb: "#f3e6b0",
      hole: true,
      newThing: "NEW \u3064\u3080\u3058\u98A8\u306B\u30CD\u30AE\u304C\u5438\u3044\u5BC4\u305B\u3089\u308C\u308B"
    },
    { name: "\u9577\u91CE\u770C", sub: "\u5C71\u3042\u3044\u306E\u6BB5\u3005\u7551", goal: 32, speed: [230, 320], gap: [0.75, 0.55], rot: 0.26, gold: 0.07, sky: ["#0b0820", "#2e2a50"], ground: "#3d5530", crater: "#2e4224", orb: "#f8eecb", double: 0.3, wind: 50 },
    {
      name: "\u57FC\u7389\u770C",
      sub: "\u30CD\u30AE\u5927\u738B\u306E\u57CE",
      goal: 40,
      speed: [220, 330],
      gap: [0.75, 0.5],
      rot: 0.28,
      gold: 0.06,
      sky: ["#170a14", "#3d1430"],
      ground: "#4a2440",
      crater: "#3a1a32",
      orb: "#ff6b8b",
      boss: true,
      double: 0.2,
      newThing: "BOSS \u30CD\u30AE\u5927\u738B\u304C\u3042\u3089\u308F\u308C\u305F\uFF01"
    }
  ];
  const STAGE_MARK = "\u2605";
  const STAGE_EN = [
    { name: "Ibaraki", sub: "Where the negi fields begin", intro: "Warm up! Catch 10 negi." },
    { name: "Chiba", sub: "Negi fields as far as you can see", newThing: "NEW Rotten negi start falling" },
    { name: "Tottori", sub: "White negi of the sand dunes", newThing: "NEW Golden negi count as 3!" },
    { name: "Gunma", sub: "Land of the dry winter wind", newThing: "NEW The wind blows negi sideways" },
    { name: "Fukuoka", sub: "Raining thin green onions", newThing: "NEW Two negi fall at once" },
    { name: "Akita", sub: "Negi fields under the snow", newThing: "NEW Snow makes the ground slippery" },
    { name: "Yamagata", sub: "A snowstorm night" },
    { name: "Miyagi", sub: "Whirlwind negi field", newThing: "NEW Whirlwinds pull the negi in" },
    { name: "Nagano", sub: "Terraced mountain fields" },
    { name: "Saitama", sub: "The Negi King's castle", newThing: "BOSS The Negi King appears!" }
  ];
  STAGES.forEach((st, i) => {
    st.en = STAGE_EN[i];
  });
  const ENDLESS = { name: "\u30A8\u30F3\u30C9\u30EC\u30B9", endless: true, sky: ["#0d1030", "#24164a"], ground: "#2f5a2c", crater: "#244722", orb: "#f3e6b0" };
  const AREA_EVERY = 15;
  let areaIdx = 0;
  const theme = () => cur.endless ? STAGES[areaIdx] : cur;
  const freshSave = () => ({
    stars: Array(STAGES.length).fill(0),
    best: 0,
    sound: true,
    pts: 0,
    owned: ["hat:none", "bk:brown", "char:cosmii"],
    hat: "none",
    basket: "brown",
    char: "cosmii",
    login: { last: "", days: 0 },
    daily: null,
    notif: false,
    notifAsked: false
  });
  let save = freshSave();
  try {
    const raw = JSON.parse(localStorage.getItem("cosmiiSave") || "null");
    if (raw && Array.isArray(raw.stars)) save = Object.assign(freshSave(), raw, { stars: STAGES.map((_, i) => raw.stars[i] || 0) });
    else {
      const b = parseInt(localStorage.getItem("cosmiiBest") || "0", 10);
      if (b) save.best = b;
    }
  } catch (e) {
  }
  if (save.char === "blue" || save.owned.includes("char:blue")) {
    if (!save.owned.includes("char:red")) save.owned.push("char:red");
    save.owned = save.owned.filter((id) => id !== "char:blue");
    if (save.char === "blue") save.char = "red";
  }
  if (!save.owned.includes("char:cosmii")) save.owned.push("char:cosmii");
  if (!["cosmii", "red", "pink", "green", "devil"].includes(save.char)) save.char = "cosmii";
  LANG = save.lang || ((navigator.language || "ja").toLowerCase().startsWith("ja") ? "ja" : "en");
  function persist() {
    try {
      localStorage.setItem("cosmiiSave", JSON.stringify(save));
    } catch (e) {
    }
  }
  const unlocked = (i) => i === 0 || save.stars[i - 1] > 0;
  const endlessOpen = () => save.stars[2] > 0;
  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * DPR;
    cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    makeStars();
    if (player) {
      player.w = pw();
      player.y = groundY();
      player.x = Math.min(Math.max(player.x, player.w / 2), W - player.w / 2);
    }
  }
  const groundY = () => H - Math.max(70, H * 0.16);
  const playerWidth = () => Math.max(96, Math.min(150, W * 0.13));
  let stars = [];
  function makeStars() {
    const n = Math.round(W * H / 5e3);
    stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.3, t: Math.random() * 7 }));
  }
  function drawNegi(c, x, y, s2, kind, rot, t) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(s2, s2);
    const rotten = kind === "rot", gold = kind === "gold";
    const leafA = gold ? "#ffe27a" : rotten ? "#5b4a1e" : "#6fd03c";
    const leafB = gold ? "#e7b52e" : rotten ? "#3f3214" : "#3f9a1f";
    c.lineCap = "round";
    c.strokeStyle = leafB;
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(0, -4);
    c.quadraticCurveTo(-10, -28, -12, -46);
    c.stroke();
    c.beginPath();
    c.moveTo(0, -4);
    c.quadraticCurveTo(10, -26, 13, -44);
    c.stroke();
    c.strokeStyle = leafA;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(0, -2);
    c.lineTo(0, -50);
    c.stroke();
    c.fillStyle = gold ? "#fff3c4" : rotten ? "#9b7a4a" : "#f3f7e8";
    c.beginPath();
    c.moveTo(-6, -4);
    c.lineTo(6, -4);
    c.lineTo(6, 24);
    c.quadraticCurveTo(0, 30, -6, 24);
    c.closePath();
    c.fill();
    c.fillStyle = gold ? "#f5d76a" : rotten ? "#6b5426" : "#c9e8a6";
    c.fillRect(-6, -6, 12, 8);
    c.strokeStyle = gold ? "#e8c45c" : rotten ? "#5a4220" : "#d8d2b8";
    c.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * 2, 26);
      c.lineTo(i * 3.5, 33);
      c.stroke();
    }
    if (rotten) {
      c.fillStyle = "#3d2a12";
      [[-2, 6, 2.4], [3, 14, 1.8], [-3, 18, 1.6], [1, -30, 2.2]].forEach(([a, b, r]) => {
        c.beginPath();
        c.arc(a, b, r, 0, 7);
        c.fill();
      });
      c.strokeStyle = "rgba(190,220,90,.75)";
      c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const ox = -12 + i * 12, ph = (t || 0) * 4 + i;
        c.beginPath();
        c.moveTo(ox, -54);
        c.bezierCurveTo(ox - 5, -60 + Math.sin(ph) * 2, ox + 5, -66, ox, -72);
        c.stroke();
      }
    }
    if (gold) {
      c.fillStyle = "rgba(255,255,255,.9)";
      const tw = 3 + Math.sin((t || 0) * 8) * 1.5;
      c.beginPath();
      c.moveTo(9, -20 - tw);
      c.lineTo(10.5, -20);
      c.lineTo(9, -20 + tw);
      c.lineTo(7.5, -20);
      c.fill();
    }
    c.restore();
  }
  function drawCosmii(p, t, c = ctx) {
    const bob = Math.sin(t * 6) * (Math.abs(p.vx) > 20 ? 2.5 : 1);
    c.save();
    c.translate(p.x, p.y + bob);
    c.rotate(Math.max(-0.18, Math.min(0.18, p.vx / 2500)));
    const s2 = p.w / 120;
    c.scale(s2, s2);
    const ch = charOf(p);
    c.fillStyle = "rgba(160,140,255,.18)";
    c.beginPath();
    c.ellipse(0, 46 - bob / s2, 52, 9, 0, 0, 7);
    c.fill();
    const sprite = ch.sprite && CHARACTER_SPRITES[ch.sprite];
    if (sprite && sprite.complete && sprite.naturalWidth) {
      c.drawImage(sprite, -58, -82, 116, 116);
      c.save();
      c.translate(0, -30);
      drawHat(c, p.hat || save.hat);
      c.restore();
    } else {
      drawFeatBack(c, ch);
      const g = c.createLinearGradient(0, -40, 0, 30);
      g.addColorStop(0, ch.top);
      g.addColorStop(1, ch.bot);
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(0, -8, 34, 34, 0, 0, 7);
      c.fill();
      drawFeatFront(c, ch);
      c.fillStyle = "rgba(255,255,255,.18)";
      c.beginPath();
      c.ellipse(-12, -24, 9, 6, -0.5, 0, 7);
      c.fill();
      const look = Math.max(-3, Math.min(3, p.vx / 120));
      c.fillStyle = "#1a1240";
      if (p.happy > 0) {
        c.strokeStyle = "#1a1240";
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(-11 + look, -10, 5, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
        c.beginPath();
        c.arc(11 + look, -10, 5, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      } else {
        c.beginPath();
        c.ellipse(-11 + look, -12, 5, 6.5, 0, 0, 7);
        c.fill();
        c.beginPath();
        c.ellipse(11 + look, -12, 5, 6.5, 0, 0, 7);
        c.fill();
        c.fillStyle = "#fff";
        c.beginPath();
        c.arc(-9.5 + look, -14, 1.8, 0, 7);
        c.fill();
        c.beginPath();
        c.arc(12.5 + look, -14, 1.8, 0, 7);
        c.fill();
      }
      c.fillStyle = "rgba(255,140,190,.55)";
      c.beginPath();
      c.ellipse(-20, -3, 5, 3, 0, 0, 7);
      c.fill();
      c.beginPath();
      c.ellipse(20, -3, 5, 3, 0, 0, 7);
      c.fill();
      c.strokeStyle = "#1a1240";
      c.lineWidth = 2.2;
      c.beginPath();
      if (p.ouch > 0) c.arc(0, 2, 4, Math.PI, 0, false);
      else c.arc(0, -3, 5, 0.2, Math.PI - 0.2);
      c.stroke();
      drawHat(c, p.hat || save.hat);
    }
    const bk = BASKETS[p.basket || save.basket] || BASKETS.brown;
    c.fillStyle = bk.body;
    c.beginPath();
    c.moveTo(-50, 14);
    c.lineTo(50, 14);
    c.lineTo(40, 44);
    c.lineTo(-40, 44);
    c.closePath();
    c.fill();
    c.strokeStyle = bk.weave;
    c.lineWidth = 2;
    for (let i = -36; i <= 36; i += 12) {
      c.beginPath();
      c.moveTo(i, 16);
      c.lineTo(i * 0.82, 43);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(-46, 26);
    c.lineTo(46, 26);
    c.stroke();
    c.fillStyle = bk.rim;
    c.beginPath();
    if (c.roundRect) c.roundRect(-54, 8, 108, 9, 4);
    else c.rect(-54, 8, 108, 9);
    c.fill();
    c.fillStyle = ch.hand;
    c.beginPath();
    c.arc(-44, 12, 7, 0, 7);
    c.fill();
    c.beginPath();
    c.arc(44, 12, 7, 0, 7);
    c.fill();
    const shown = Math.min(p.stack, 5);
    for (let i = 0; i < shown; i++) {
      c.save();
      c.translate(-28 + i * 14, 6);
      c.rotate(-0.25 + i * 0.12);
      c.scale(0.45, 0.45);
      c.fillStyle = "#6fd03c";
      c.fillRect(-4, -40, 8, 40);
      c.restore();
    }
    c.restore();
  }
  const COSMIIS = {
    cosmii: { number: "001", sprite: "001.png", name: "001 \u30B3\u30B9\u30DF\u30FC", en: { name: "001 Cosmii", ab: "The original Cosmii" }, ab: "\u4E3B\u4EBA\u516C", price: 0, top: "#b6e2ff", bot: "#4fa8f0", hand: "#7cc0f7", feat: "fluffy", power: null },
    red: { number: "002", sprite: "002.png", name: "002 \u3042\u304B\u30B3\u30B9\u30DF\u30FC", en: { name: "002 Red Cosmii", ab: "More golden negi" }, ab: "\u91D1\u306E\u30CD\u30AE\u304C\u51FA\u3084\u3059\u3044", price: 600, top: "#ff9a8c", bot: "#e8402e", hand: "#f0675a", feat: "stars", power: "lucky" },
    pink: { number: "003", sprite: "003.png", name: "003 \u3082\u3082\u30B3\u30B9\u30DF\u30FC", en: { name: "003 Pink Cosmii", ab: "One extra \u2665" }, ab: "\u2665\u304C1\u3064\u591A\u3044", price: 400, top: "#ffc8dd", bot: "#ff7fae", hand: "#ff9cc2", feat: "cat", power: "heart" },
    green: { number: "004", sprite: "004.png", name: "004 \u307F\u3069\u308A\u30B3\u30B9\u30DF\u30FC", en: { name: "004 Green Cosmii", ab: "Slightly bigger basket" }, ab: "\u30AB\u30B4\u304C\u5C11\u3057\u5927\u304D\u3044", price: 300, top: "#b6ec8a", bot: "#5cb83a", hand: "#7ccf55", feat: "sprout", power: "wide" },
    devil: { number: "005", sprite: "005.png", name: "005 \u3053\u3042\u304F\u307E\u30B3\u30B9\u30DF\u30FC", en: { name: "005 Imp Cosmii", ab: "Blocks 1 rotten negi" }, ab: "\u8150\u3063\u305F\u30CD\u30AE\u30921\u56DE\u30AC\u30FC\u30C9", price: 800, top: "#dcbcff", bot: "#9a5ce0", hand: "#b483ee", feat: "devil", power: "guard" }
  };
  const CHARACTER_SPRITES = Object.fromEntries(
    Object.values(COSMIIS).map((ch) => {
      const image = new Image();
      image.src = `./img/characters/${ch.sprite}`;
      return [ch.sprite, image];
    })
  );
  const charOf = (p) => COSMIIS[p && p.char || save.char] || COSMIIS.cosmii;
  const power = () => (COSMIIS[save.char] || COSMIIS.cosmii).power;
  function star5(c, x, y, r, fill) {
    c.fillStyle = fill;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    c.fill();
  }
  function drawFeatBack(c, ch) {
    if (ch.feat === "devil") {
      c.fillStyle = ch.bot;
      [-1, 1].forEach((d) => {
        c.beginPath();
        c.moveTo(d * 28, -14);
        c.lineTo(d * 56, -34);
        c.lineTo(d * 50, -18);
        c.lineTo(d * 60, -10);
        c.lineTo(d * 48, -4);
        c.lineTo(d * 52, 6);
        c.lineTo(d * 30, 0);
        c.closePath();
        c.fill();
      });
    }
    if (ch.feat === "fluffy") {
      c.fillStyle = ch.top;
      [[-30, -30], [-14, -42], [4, -44], [22, -38], [34, -24], [-36, -12], [38, -8]].forEach(([x, y]) => {
        c.beginPath();
        c.arc(x, y, 12, 0, 7);
        c.fill();
      });
    }
    if (ch.feat === "stars") {
      c.fillStyle = ch.bot;
      [-1, 1].forEach((d) => {
        c.beginPath();
        c.ellipse(d * 36, -14, 13, 17, d * 0.3, 0, 7);
        c.fill();
      });
    }
  }
  function drawFeatFront(c, ch) {
    c.lineCap = "round";
    if (ch.feat === "antenna") {
      c.strokeStyle = "#c9b8ff";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-8, -38);
      c.quadraticCurveTo(-14, -56, -6, -62);
      c.stroke();
      c.beginPath();
      c.moveTo(8, -38);
      c.quadraticCurveTo(16, -54, 10, -62);
      c.stroke();
      c.fillStyle = "#ffd55a";
      c.beginPath();
      c.arc(-6, -63, 4.5, 0, 7);
      c.fill();
      c.beginPath();
      c.arc(10, -63, 4.5, 0, 7);
      c.fill();
    } else if (ch.feat === "sprout") {
      c.strokeStyle = "#3f8f22";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, -40);
      c.quadraticCurveTo(2, -50, 0, -56);
      c.stroke();
      c.fillStyle = "#6cc644";
      c.beginPath();
      c.ellipse(-9, -58, 10, 6, -0.5, 0, 7);
      c.fill();
      c.beginPath();
      c.ellipse(9, -60, 10, 6, 0.5, 0, 7);
      c.fill();
      star5(c, 26, -30, 7, "#ffd55a");
    } else if (ch.feat === "cat") {
      [-1, 1].forEach((d) => {
        c.fillStyle = ch.bot;
        c.beginPath();
        c.moveTo(d * 10, -38);
        c.lineTo(d * 28, -56);
        c.lineTo(d * 30, -26);
        c.closePath();
        c.fill();
        c.fillStyle = "#ffe3ee";
        c.beginPath();
        c.moveTo(d * 15, -37);
        c.lineTo(d * 26, -49);
        c.lineTo(d * 27, -31);
        c.closePath();
        c.fill();
      });
      c.fillStyle = "#ff5f86";
      c.beginPath();
      c.arc(-28, -54, 4, 0, 7);
      c.arc(28, -54, 4, 0, 7);
      c.fill();
    } else if (ch.feat === "fluffy") {
      c.fillStyle = "#ff9cc2";
      c.beginPath();
      c.moveTo(20, -40);
      c.lineTo(8, -48);
      c.lineTo(9, -32);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(20, -40);
      c.lineTo(32, -48);
      c.lineTo(31, -32);
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(20, -40, 4, 0, 7);
      c.fill();
      star5(c, -24, -34, 6, "#ffd55a");
    } else if (ch.feat === "stars") {
      star5(c, -36, -14, 9, "#ffd55a");
      star5(c, 36, -14, 9, "#ffd55a");
    } else if (ch.feat === "devil") {
      c.fillStyle = "#7a3fc4";
      [-1, 1].forEach((d) => {
        c.beginPath();
        c.moveTo(d * 12, -38);
        c.quadraticCurveTo(d * 22, -52, d * 26, -58);
        c.quadraticCurveTo(d * 26, -44, d * 22, -32);
        c.closePath();
        c.fill();
      });
    }
  }
  const HATS = {
    none: { name: "\u306A\u3057", en: { name: "None" }, price: 0 },
    negi: { name: "\u30CD\u30AE\u304B\u3056\u308A", en: { name: "Negi pin" }, price: 50 },
    ribbon: { name: "\u30EA\u30DC\u30F3", en: { name: "Ribbon" }, price: 80 },
    straw: { name: "\u3080\u304E\u308F\u3089", en: { name: "Straw hat" }, price: 120 },
    crown: { name: "\u304A\u3046\u304B\u3093", en: { name: "Crown" }, price: 200 }
  };
  const BASKETS = {
    brown: { name: "\u3044\u3064\u3082\u306E", en: { name: "Classic" }, price: 0, body: "#c98a4b", weave: "#8c5a2b", rim: "#e0a564" },
    pink: { name: "\u3055\u304F\u3089", en: { name: "Sakura" }, price: 60, body: "#ff9cc0", weave: "#d8668f", rim: "#ffc4da" },
    sky: { name: "\u305D\u3089\u3044\u308D", en: { name: "Sky" }, price: 60, body: "#6fcfe3", weave: "#2f95ab", rim: "#a8e6f2" },
    negi: { name: "\u30CD\u30AE\u3044\u308D", en: { name: "Negi green" }, price: 100, body: "#7fd65a", weave: "#3f8f22", rim: "#c7f0a8" },
    gold: { name: "\u304D\u3093\u3044\u308D", en: { name: "Gold" }, price: 250, body: "#f2c23a", weave: "#b8860b", rim: "#ffe68a" }
  };
  function drawHat(c, hat) {
    if (!hat || hat === "none") return;
    c.save();
    if (hat === "negi") {
      drawNegi(c, 16, -44, 0.42, "good", 0.5, 0);
    } else if (hat === "ribbon") {
      c.fillStyle = "#ff6fa3";
      c.beginPath();
      c.moveTo(18, -36);
      c.lineTo(4, -46);
      c.lineTo(6, -28);
      c.closePath();
      c.fill();
      c.beginPath();
      c.moveTo(18, -36);
      c.lineTo(32, -46);
      c.lineTo(30, -28);
      c.closePath();
      c.fill();
      c.fillStyle = "#ffb3cf";
      c.beginPath();
      c.arc(18, -37, 4.5, 0, 7);
      c.fill();
    } else if (hat === "straw") {
      c.fillStyle = "#f2d27a";
      c.beginPath();
      c.ellipse(0, -36, 44, 9, 0, 0, 7);
      c.fill();
      c.beginPath();
      c.ellipse(0, -44, 24, 14, 0, Math.PI, 0);
      c.fill();
      c.fillStyle = "#ff6f6f";
      c.fillRect(-24, -44, 48, 5);
      c.strokeStyle = "#c9a24a";
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(0, -36, 44, 9, 0, 0, 7);
      c.stroke();
    } else if (hat === "crown") {
      c.fillStyle = "#ffd55a";
      c.beginPath();
      c.moveTo(-18, -38);
      c.lineTo(-18, -56);
      c.lineTo(-9, -47);
      c.lineTo(0, -60);
      c.lineTo(9, -47);
      c.lineTo(18, -56);
      c.lineTo(18, -38);
      c.closePath();
      c.fill();
      c.strokeStyle = "#c89a1c";
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = "#ff6fa3";
      c.beginPath();
      c.arc(0, -46, 3.5, 0, 7);
      c.fill();
    }
    c.restore();
  }
  function drawBoss(b, t) {
    const c = ctx;
    c.save();
    c.translate(b.x, b.y + Math.sin(t * 2) * 6);
    const s2 = Math.min(W, H) / 520;
    c.scale(s2, s2);
    c.fillStyle = "rgba(255,255,255,.14)";
    [[-50, 70, 34], [0, 78, 40], [50, 70, 34]].forEach(([x, y, r]) => {
      c.beginPath();
      c.arc(x, y, r, 0, 7);
      c.fill();
    });
    c.lineCap = "round";
    const sway = Math.sin(t * 3) * 6;
    c.strokeStyle = "#3f9a1f";
    c.lineWidth = 16;
    c.beginPath();
    c.moveTo(-10, -30);
    c.quadraticCurveTo(-40, -80, -60 + sway, -120);
    c.stroke();
    c.beginPath();
    c.moveTo(10, -30);
    c.quadraticCurveTo(40, -80, 60 + sway, -120);
    c.stroke();
    c.strokeStyle = "#6fd03c";
    c.lineWidth = 18;
    c.beginPath();
    c.moveTo(0, -30);
    c.lineTo(sway, -140);
    c.stroke();
    c.fillStyle = "#f3f7e8";
    c.beginPath();
    c.moveTo(-34, -30);
    c.lineTo(34, -30);
    c.lineTo(34, 60);
    c.quadraticCurveTo(0, 80, -34, 60);
    c.closePath();
    c.fill();
    c.fillStyle = "#c9e8a6";
    c.fillRect(-34, -36, 68, 14);
    c.fillStyle = "#ffd55a";
    c.beginPath();
    c.moveTo(-30, -36);
    c.lineTo(-30, -58);
    c.lineTo(-15, -46);
    c.lineTo(0, -64);
    c.lineTo(15, -46);
    c.lineTo(30, -58);
    c.lineTo(30, -36);
    c.closePath();
    c.fill();
    c.fillStyle = "#ff6b8b";
    c.beginPath();
    c.arc(0, -46, 4, 0, 7);
    c.fill();
    const angry = b.angry > 0;
    c.strokeStyle = "#1a1240";
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-22, angry ? -6 : -10);
    c.lineTo(-8, angry ? -2 : -8);
    c.stroke();
    c.beginPath();
    c.moveTo(22, angry ? -6 : -10);
    c.lineTo(8, angry ? -2 : -8);
    c.stroke();
    c.fillStyle = "#1a1240";
    c.beginPath();
    c.arc(-14, 6, 5, 0, 7);
    c.fill();
    c.beginPath();
    c.arc(14, 6, 5, 0, 7);
    c.fill();
    c.strokeStyle = "#3f9a1f";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(0, 20);
    c.quadraticCurveTo(-14, 30, -26, 20);
    c.stroke();
    c.beginPath();
    c.moveTo(0, 20);
    c.quadraticCurveTo(14, 30, 26, 20);
    c.stroke();
    c.restore();
  }
  function drawBackground(st, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, st.sky[0]);
    g.addColorStop(1, st.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (const s2 of stars) {
      ctx.globalAlpha = 0.45 + Math.sin(t * 1.5 + s2.t) * 0.35;
      ctx.fillStyle = "#e8e4ff";
      ctx.beginPath();
      ctx.arc(s2.x, s2.y, s2.r, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const pr = Math.min(W, H) * 0.12, px = W * 0.86, py = H * 0.24;
    if (!st.boss) {
      const halo = ctx.createRadialGradient(px, py, pr * 0.6, px, py, pr * 2);
      halo.addColorStop(0, "rgba(255,245,210,.22)");
      halo.addColorStop(1, "rgba(255,245,210,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(px, py, pr * 2, 0, 7);
      ctx.fill();
      ctx.fillStyle = st.orb;
      ctx.beginPath();
      ctx.arc(px, py, pr * 0.7, 0, 7);
      ctx.fill();
    }
    if (st.hole && !cur.endless) {
      const hx = holeX(t), hy = H * 0.24;
      ctx.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        const yy = hy - pr * 0.8 + i * pr * 0.4;
        const rw = pr * (1.4 - i * 0.16);
        ctx.strokeStyle = `rgba(230,240,255,${0.12 + i * 0.03})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(hx + Math.sin(t * 3 + i) * 6, yy, rw, rw * 0.22, 0, t * 4 + i, t * 4 + i + 4.2);
        ctx.stroke();
      }
    }
    const gy = groundY() + (player ? player.w * 0.38 : 40);
    ctx.fillStyle = st.ground;
    ctx.beginPath();
    ctx.moveTo(0, gy);
    for (let x = 0; x <= W; x += 40) ctx.lineTo(x, gy + Math.sin(x * 0.013) * 6);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = st.crater;
    ctx.lineWidth = 5;
    for (let r = 1; r <= 4; r++) {
      const yy = gy + r * ((H - gy) / 5);
      ctx.beginPath();
      ctx.moveTo(0, yy);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, yy + Math.sin(x * 0.013 + r) * 4);
      ctx.stroke();
    }
    if (!st.ice && !st.boss) {
      ctx.strokeStyle = "rgba(127,220,74,.55)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let x = 20; x < W; x += 46) {
        const yy = gy + Math.sin(x * 0.013) * 6 + 2;
        ctx.beginPath();
        ctx.moveTo(x, yy);
        ctx.lineTo(x - 4, yy - 14);
        ctx.moveTo(x, yy);
        ctx.lineTo(x + 4, yy - 16);
        ctx.stroke();
      }
    }
    if (st.ice) {
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(0, gy - 2, W, 3);
    }
  }
  let flakes = [];
  function drawWeather(st, dt) {
    if (!st.wind) return;
    if (flakes.length < 60) flakes.push({ x: Math.random() * W, y: Math.random() * H, s: 1 + Math.random() * 2 });
    ctx.fillStyle = st.ice ? "rgba(255,255,255,.7)" : "rgba(255,200,150,.35)";
    for (const f2 of flakes) {
      f2.x += (windNow * 3 + 20 * Math.sign(windNow || 1)) * dt;
      f2.y += (st.ice ? 60 : 15) * f2.s * dt;
      if (f2.x > W + 10) f2.x = -10;
      if (f2.x < -10) f2.x = W + 10;
      if (f2.y > H) f2.y = -5;
      if (st.ice) {
        ctx.beginPath();
        ctx.arc(f2.x, f2.y, f2.s, 0, 7);
        ctx.fill();
      } else ctx.fillRect(f2.x, f2.y, 14 * f2.s, 1.5);
    }
  }
  [["ic1", "good"], ["ic2", "gold"], ["ic3", "rot"]].forEach(([id, k]) => {
    const c = $(id).getContext("2d");
    c.scale(2, 2);
    drawNegi(c, 15, 27, 0.5, k, 0, 1);
  });
  const LEADERBOARD = {
    endless: "cosmii_endless_best",
    // エンドレスのベストスコア
    stars: "cosmii_total_stars"
    // 集めた★の合計
  };
  const APP_URL = "https://apps.apple.com/app/idXXXXXXXXXX";
  const HASHTAG = "#CosmiiCatch";
  const plug = (name) => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[name] || null;
  const GC = plug("CapacitorGameConnect");
  const LN = plug("LocalNotifications");
  const NOTIF_HOUR = 19;
  const browserNotificationsAvailable = () => "Notification" in window;
  let browserNotificationTimers = [];
  const NOTIF_TEXT = {
    ja: {
      d1: { title: "\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u304C\u3068\u3069\u3044\u3066\u308B\u3088\uFF01", body: "\u304D\u3087\u3046\u306E\u30DF\u30C3\u30B7\u30E7\u30F3\u3082\u5165\u308C\u304B\u308F\u3063\u305F\u3088\u3002Cosmii\u3068\u3044\u3063\u3057\u3087\u306B\u30CD\u30AE\u3092\u30AD\u30E3\u30C3\u30C1\u3057\u3088\u3046" },
      d7: { title: "Cosmii\u304C\u307E\u3063\u3066\u308B\u3088\u2026", body: "\u3072\u3055\u3057\u3076\u308A\uFF01\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u3068\u65B0\u3057\u3044\u30DF\u30C3\u30B7\u30E7\u30F3\u304C\u5F85\u3063\u3066\u308B\u3088" }
    },
    en: {
      d1: { title: "Your login bonus is here!", body: "Today's missions are ready too. Come catch some negi with Cosmii" },
      d7: { title: "Cosmii misses you\u2026", body: "It's been a while! Your login bonus and new missions are waiting" }
    }
  };
  function atDaysLater(days) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + days);
    d.setHours(NOTIF_HOUR, 0, 0, 0);
    return d;
  }
  async function scheduleReminders() {
    if (!save.notif) return;
    if (LN) {
      try {
        await LN.cancel({ notifications: [{ id: 101 }, { id: 107 }] });
        const tx2 = NOTIF_TEXT[LANG] || NOTIF_TEXT.ja;
        await LN.schedule({ notifications: [
          { id: 101, title: tx2.d1.title, body: tx2.d1.body, schedule: { at: atDaysLater(1), allowWhileIdle: true } },
          { id: 107, title: tx2.d7.title, body: tx2.d7.body, schedule: { at: atDaysLater(7), allowWhileIdle: true } }
        ] });
      } catch (e) {
        console.error("Could not schedule local reminders", e);
      }
      return;
    }
    if (!browserNotificationsAvailable() || Notification.permission !== "granted") return;
    browserNotificationTimers.forEach((timer) => clearTimeout(timer));
    browserNotificationTimers = [];
    const tx = NOTIF_TEXT[LANG] || NOTIF_TEXT.ja;
    [
      { days: 1, id: "d1" },
      { days: 7, id: "d7" }
    ].forEach(({ days, id }) => {
      const delay = Math.max(0, atDaysLater(days).getTime() - Date.now());
      browserNotificationTimers.push(setTimeout(() => {
        if (!save.notif || Notification.permission !== "granted") return;
        try {
          new Notification(tx[id].title, { body: tx[id].body, icon: "./img/characters/001.png" });
        } catch (e) {
          console.error("Could not show browser reminder notification", e);
        }
      }, delay));
    });
  }
  async function cancelReminders() {
    browserNotificationTimers.forEach((timer) => clearTimeout(timer));
    browserNotificationTimers = [];
    if (!LN) return;
    try {
      await LN.cancel({ notifications: [{ id: 101 }, { id: 107 }] });
    } catch (e) {
      console.error("Could not cancel local reminders", e);
    }
  }
  async function turnOnNotifs() {
    if (LN) {
      try {
        let st = await LN.checkPermissions();
        if (st.display !== "granted") st = await LN.requestPermissions();
        save.notif = st.display === "granted";
      } catch (e) {
        save.notif = false;
        console.error("Could not request local notification permission", e);
      }
    } else if (browserNotificationsAvailable()) {
      try {
        save.notif = await Notification.requestPermission() === "granted";
      } catch (e) {
        save.notif = false;
        console.error("Could not request browser notification permission", e);
      }
    } else {
      save.notif = false;
    }
    persist();
    if (save.notif) await scheduleReminders();
    updateNotifBtn();
    return save.notif;
  }
  function updateNotifBtn() {
    const b = $("notifBtn");
    b.hidden = !LN && !browserNotificationsAvailable();
    b.classList.toggle("on", !!save.notif);
    const label = save.notif ? tr("nt.on") : tr("nt.off");
    b.setAttribute("aria-label", label);
    b.title = label;
  }
  function maybeAskNotifs() {
    if (!LN && !browserNotificationsAvailable() || save.notif || save.notifAsked) return false;
    if (!LN && Notification.permission === "denied") return false;
    save.notifAsked = true;
    persist();
    const c = $("notifCv").getContext("2d");
    c.clearRect(0, 0, 240, 170);
    drawCosmii({ x: 120, y: 100, w: 150, vx: 0, ouch: 0, happy: 1, stack: 3 }, 0, c);
    $("notifScreen").hidden = false;
    $("notifYes").focus();
    return true;
  }
  function hasAskedForNotifs() {
    return save.notifAsked || save.notif;
  }
  let gcReady = false;
  async function gcSignIn() {
    if (!GC || !window.Capacitor?.isNativePlatform()) return false;
    try {
      await GC.signIn();
      gcReady = true;
      ["rankBtn", "clearRankBtn", "overRankBtn"].forEach((id) => {
        $(id).hidden = false;
      });
      const stars2 = totalStars();
      if (stars2 > 0) gcSubmit(LEADERBOARD.stars, stars2);
      if (save.best > 0) gcSubmit(LEADERBOARD.endless, save.best);
      return true;
    } catch (e) {
      gcReady = false;
      console.error("Game Center sign-in failed", e);
      return false;
    }
  }
  async function gcSubmit(id, value) {
    if (!GC || !gcReady) return;
    try {
      await GC.submitScore({ leaderboardID: id, totalScoreAmount: value });
    } catch (e) {
      console.error(`Could not submit score to Game Center leaderboard "${id}"`, e);
    }
  }
  async function gcShow(id) {
    if (!gcReady) {
      await gcSignIn();
      if (!gcReady) return;
    }
    try {
      if (id) await GC.showLeaderboard({ leaderboardID: id });
      else await GC.showAllLeaderboards();
    } catch (e) {
      console.error("Could not show the Game Center leaderboard", e);
      showShareNote(tr("rank.error"));
    }
  }
  const totalStars = () => save.stars.reduce((a, b) => a + b, 0);
  let lastResult = null;
  function shareText(r) {
    if (r.kind === "clear") {
      const st = "\u2605".repeat(r.stars) + "\u2606".repeat(3 - r.stars);
      return r.last ? `${tr("sh.king", { st })}
${HASHTAG}` : `${tr("sh.clear", { n: r.stage, name: STAGE_MARK, st })}
${HASHTAG}`;
    }
    if (r.kind === "endless") return `${tr("sh.endless", { n: r.score, area: STAGE_MARK, best: r.best ? tr("sh.best") : "" })}
${HASHTAG}`;
    return `${tr("sh.fail", { n: r.stage, name: STAGE_MARK, left: r.left })}
${HASHTAG}`;
  }
  function makeShareImage(r) {
    const S = 1080;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const x = c.getContext("2d");
    const st = r.stageIndex >= 0 ? STAGES[r.stageIndex] : ENDLESS;
    const g = x.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, st.sky[0]);
    g.addColorStop(1, st.sky[1]);
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    for (let i = 0; i < 140; i++) {
      x.globalAlpha = 0.3 + Math.random() * 0.6;
      x.fillStyle = "#e8e4ff";
      x.beginPath();
      x.arc(Math.random() * S, Math.random() * S * 0.75, Math.random() * 2.4 + 0.6, 0, 7);
      x.fill();
    }
    x.globalAlpha = 1;
    x.fillStyle = st.ground;
    x.beginPath();
    x.moveTo(0, S * 0.8);
    for (let i = 0; i <= S; i += 40) x.lineTo(i, S * 0.8 + Math.sin(i * 0.01) * 10);
    x.lineTo(S, S);
    x.lineTo(0, S);
    x.fill();
    [[160, 330, "good", -0.3], [900, 280, "gold", 0.25], [820, 520, "good", -0.15], [230, 600, "rot", 0.2]].forEach(([nx, ny, k, rr]) => drawNegi(x, nx, ny, 1.9, k, rr, 1));
    x.textAlign = "center";
    x.fillStyle = "#7fdc4a";
    x.font = '400 92px "Dela Gothic One", sans-serif';
    x.fillText("Cosmii Catch", S / 2, 150);
    x.fillStyle = "#f4f1ff";
    x.font = '800 52px "M PLUS Rounded 1c", sans-serif';
    let head, big;
    const nm = STAGE_MARK;
    if (r.kind === "clear") {
      head = r.last ? tr("kingDown") : `STAGE ${r.stage}  ${nm}`;
      big = "\u2605".repeat(r.stars) + "\u2606".repeat(3 - r.stars);
    } else if (r.kind === "endless") {
      head = tr("img.endless", { area: nm });
      big = tr("img.pts", { n: r.score });
    } else {
      head = `STAGE ${r.stage}  ${nm}`;
      big = tr("img.left", { n: r.left });
    }
    x.fillText(head, S / 2, 260);
    x.fillStyle = r.kind === "clear" ? "#ffd55a" : "#f4f1ff";
    x.font = '400 150px "Dela Gothic One", sans-serif';
    x.fillText(big, S / 2, 450);
    drawCosmii({ x: S / 2, y: S * 0.72, w: 360, vx: 0, ouch: 0, happy: r.kind === "fail" ? 0 : 1, stack: 5 }, 0, x);
    x.fillStyle = "rgba(244,241,255,.85)";
    x.font = '800 36px "M PLUS Rounded 1c", sans-serif';
    x.fillText(HASHTAG, S / 2, S - 50);
    return c;
  }
  async function shareResult() {
    if (!lastResult) return;
    const text = shareText(lastResult);
    const img = makeShareImage(lastResult);
    const Share2 = plug("Share"), FS = plug("Filesystem");
    if (Share2) {
      try {
        let files;
        if (FS) {
          const data = img.toDataURL("image/png").split(",")[1];
          const w = await FS.writeFile({ path: "cosmii-result.png", data, directory: "CACHE" });
          files = [w.uri];
        }
        await Share2.share({ text, url: APP_URL, files, dialogTitle: tr("sh.title") });
        return;
      } catch (e) {
        if (String(e && e.message || e).includes("cancel")) return;
      }
    }
    try {
      const blob = await new Promise((res) => img.toBlob(res, "image/png"));
      const file = new File([blob], "cosmii-result.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ text: text + "\n" + APP_URL, files: [file] });
        return;
      }
      if (navigator.share) {
        await navigator.share({ text: text + "\n" + APP_URL });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(text + "\n" + APP_URL);
      showShareNote(tr("sh.copied"));
    } catch (e) {
      showShareNote(tr("sh.cant"));
    }
  }
  async function postResultToX() {
    if (!lastResult) return;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(lastResult))}`;
    const Browser3 = plug("Browser");
    try {
      if (Browser3) {
        await Browser3.open({ url });
        return;
      }
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    } catch (e) {
      console.error("Could not open the X post composer", e);
      showShareNote(tr("sh.cant"));
    }
  }
  function showShareNote(msg) {
    const n = $("shareNote");
    n.textContent = msg;
    n.hidden = false;
    const visible = !$("clearScreen").hidden ? $("clearScreen") : $("overScreen");
    visible.querySelector(".card").appendChild(n);
    setTimeout(() => {
      n.hidden = true;
    }, 2500);
  }
  let player = null, items = [], particles = [], boss = null;
  let cur = ENDLESS, curIndex = -1;
  let score = 0, caught = 0, lives = 3, running = false, paused = false;
  let spawnTimer = 0, elapsed = 0, lastT = 0, introTimer = 0, windNow = 0;
  let MAX_LIVES = 3, guardLeft = 0;
  const holeX = (t) => W / 2 + Math.sin(t * 0.5) * W * 0.3;
  const pw = () => playerWidth() * (power() === "wide" ? 1.2 : 1);
  function newPlayer() {
    return { x: W / 2, y: groundY(), w: pw(), vx: 0, ouch: 0, happy: 0, stack: 0 };
  }
  function renderLives() {
    let h = "";
    for (let i = 0; i < MAX_LIVES; i++) h += `<span class="${i < lives ? "" : "lost"}">\u2665</span>`;
    $("lives").innerHTML = h;
  }
  function renderHud() {
    if (cur.endless) {
      $("scoreLabel").textContent = "SCORE";
      $("score").textContent = score;
      $("progressWrap").hidden = true;
    } else {
      $("scoreLabel").textContent = "STAGE " + (curIndex + 1);
      $("score").textContent = "";
      $("progressWrap").hidden = false;
      const c = Math.min(caught, cur.goal);
      $("progText").textContent = `${c}/${cur.goal}`;
      $("bar").style.width = c / cur.goal * 100 + "%";
    }
  }
  function flash(text, color) {
    const f2 = $("flash");
    f2.textContent = text;
    f2.style.color = color;
    f2.classList.add("show");
    clearTimeout(flash._t);
    flash._t = setTimeout(() => f2.classList.remove("show"), 550);
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 180;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 80, life: 0.6, color });
    }
  }
  const overlays = ["notifScreen", "splashScreen", "titleScreen", "charScreen", "selectScreen", "zukanScreen", "snsScreen", "howtoScreen", "loginScreen", "missionScreen", "shopScreen", "pauseScreen", "clearScreen", "overScreen"];
  function show(id) {
    overlays.forEach((o) => {
      $(o).hidden = o !== id;
    });
  }
  function begin(index) {
    curIndex = index;
    cur = index < 0 ? ENDLESS : STAGES[index];
    player = newPlayer();
    items = [];
    particles = [];
    flakes = [];
    boss = cur.boss ? { x: W / 2, y: H * 0.17, dir: 1, angry: 0 } : null;
    MAX_LIVES = power() === "heart" ? 4 : 3;
    guardLeft = power() === "guard" ? 1 : 0;
    score = 0;
    caught = 0;
    lives = MAX_LIVES;
    elapsed = 0;
    spawnTimer = 0;
    areaIdx = 0;
    run = { pts: 0, negi: 0, gold: 0 };
    missionEvent("play", 1);
    renderLives();
    renderHud();
    show(null);
    $("hud").hidden = false;
    $("bnEyebrow").textContent = cur.endless ? "MODE" : cur.boss ? "FINAL STAGE" : "STAGE";
    $("bnNum").textContent = cur.endless ? "ENDLESS" : String(index + 1);
    $("bnName").textContent = cur.endless ? tr("endless.intro") : `${STAGE_MARK}\u3000${L(cur, "sub")}`;
    $("bnGoal").textContent = cur.endless ? tr("best", { n: save.best }) : tr("goal", { n: cur.goal });
    const nt = cur.endless ? "" : L(cur, "newThing") || L(cur, "intro") || "";
    $("bnNew").textContent = nt;
    $("bnNew").hidden = !nt;
    $("banner").hidden = false;
    introTimer = 2;
    running = true;
    paused = false;
    recenterTilt();
    requestWake();
  }
  let arriveT = null;
  function arrive(st) {
    $("bnEyebrow").textContent = "NEXT AREA";
    $("bnNum").textContent = STAGE_MARK;
    $("bnName").textContent = tr("arrive", { sub: L(st, "sub") });
    $("bnGoal").textContent = "";
    $("bnNew").hidden = true;
    $("banner").hidden = false;
    clearTimeout(arriveT);
    arriveT = setTimeout(() => {
      if (introTimer <= 0) $("banner").hidden = true;
    }, 1600);
  }
  function stageClear() {
    running = false;
    $("hud").hidden = true;
    $("banner").hidden = true;
    const stars2 = Math.max(1, 3 - (MAX_LIVES - lives));
    const prev = save.stars[curIndex];
    if (stars2 > prev) save.stars[curIndex] = stars2;
    missionEvent("clear", 1);
    if (stars2 === 3) missionEvent("star3", 1);
    const bonus = 10 + stars2 * 5;
    const earned = run.pts + bonus;
    save.pts += earned;
    persist();
    $("clearEarn").innerHTML = COIN_IC + tr("earnClear", { n: earned, b: bonus });
    const last = curIndex === STAGES.length - 1;
    $("clearEyebrow").textContent = "STAGE " + (curIndex + 1) + "\u3000" + STAGE_MARK;
    $("clearTitle").textContent = last ? tr("kingDown") : tr("clear");
    $("clearStars").innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars2 ? "on" : ""}">\u2605</span>`).join("");
    let msg = stars2 === 3 ? tr("perfect") : tr("lostHearts", { n: 3 - stars2 });
    if (curIndex === 2 && prev === 0) msg += "\n" + tr("endlessOpen");
    if (last && prev === 0) msg = tr("allDone");
    $("clearMsg").textContent = msg;
    $("clearMsg").style.whiteSpace = "pre-line";
    $("nextBtn").hidden = last;
    lastResult = { kind: "clear", stageIndex: curIndex, stage: curIndex + 1, stars: stars2, last, total: totalStars() };
    gcSubmit(LEADERBOARD.stars, totalStars());
    show("clearScreen");
    (last ? $("clearSelectBtn") : $("nextBtn")).focus();
    playSound("clear");
    if (navigator.vibrate) try {
      navigator.vibrate([40, 60, 40]);
    } catch (e) {
    }
  }
  function gameOver() {
    running = false;
    $("hud").hidden = true;
    $("banner").hidden = true;
    if (cur.endless) missionEvent("endless", score);
    save.pts += run.pts;
    persist();
    $("overEarn").innerHTML = run.pts ? COIN_IC + tr("earn", { n: run.pts }) : "";
    if (cur.endless) {
      const isBest = score > save.best;
      if (isBest) {
        save.best = score;
        persist();
      }
      $("overEyebrow").textContent = "ENDLESS";
      $("overTitle").textContent = tr("gameover");
      $("finalScore").textContent = score;
      $("finalScore").hidden = false;
      $("overMsg").textContent = (isBest && score > 0 ? tr("newBest") : "") + tr("best", { n: save.best });
      lastResult = { kind: "endless", stageIndex: areaIdx, score, best: isBest && score > 0 };
      if (score > 0) gcSubmit(LEADERBOARD.endless, score);
      $("overShareBtn").hidden = score === 0;
    } else {
      $("overEyebrow").textContent = "STAGE " + (curIndex + 1) + "\u3000" + STAGE_MARK;
      $("overTitle").textContent = tr("miss");
      $("finalScore").textContent = `${caught}/${cur.goal}`;
      $("finalScore").hidden = false;
      const left = cur.goal - caught;
      $("overMsg").textContent = left <= 3 ? tr("close3", { n: left }) : tr("leftN", { n: left });
      lastResult = { kind: "fail", stageIndex: curIndex, stage: curIndex + 1, left };
      $("overShareBtn").hidden = left > 3;
    }
    show("overScreen");
    $("againBtn").focus();
    playSound("over");
  }
  function params() {
    if (cur.endless) {
      const d = Math.min(1, elapsed / 150);
      return { gap: 1.15 - d * 0.7, speed: 150 + d * 260, rot: 0.14 + d * 0.16, gold: 0.05, double: d > 0.5 ? 0.2 : 0 };
    }
    const f2 = Math.min(1, caught / cur.goal);
    const lerp = (a, b) => a + (b - a) * f2;
    return { gap: lerp(cur.gap[0], cur.gap[1]), speed: lerp(cur.speed[0], cur.speed[1]), rot: cur.rot, gold: cur.gold, double: cur.double || 0 };
  }
  function makeItem(x, p) {
    const r = Math.random();
    const kind = r < p.rot ? "rot" : r < p.rot + p.gold ? "gold" : "good";
    return {
      x,
      y: boss ? boss.y + 20 : -50,
      vy: (p.speed + Math.random() * 50) * (H / 700) * (kind === "gold" ? 1.25 : 1),
      kind,
      rot: (Math.random() - 0.5) * 0.6,
      spin: (Math.random() - 0.5) * 2,
      sway: Math.random() * 7
    };
  }
  function spawn() {
    const p = params();
    if (power() === "lucky") p.gold *= 2;
    const margin = 30;
    let x;
    if (boss) {
      x = boss.x + (Math.random() - 0.5) * 120;
      boss.angry = 0.4;
    } else x = margin + Math.random() * (W - margin * 2);
    x = Math.max(margin, Math.min(W - margin, x));
    items.push(makeItem(x, p));
    if (Math.random() < p.double) {
      let x2 = x + (Math.random() < 0.5 ? -1 : 1) * (W * 0.25 + Math.random() * W * 0.2);
      if (x2 < margin || x2 > W - margin) x2 = x - (x2 - x);
      x2 = Math.max(margin, Math.min(W - margin, x2));
      items.push(makeItem(x2, p));
    }
    spawnTimer = p.gap * (0.7 + Math.random() * 0.6);
  }
  let tiltOn = false, tiltValue = 0, tiltZero = 0, tiltAsked = false;
  const keys = { left: false, right: false };
  let dragX = null;
  function screenAngle() {
    if (screen.orientation && typeof screen.orientation.angle === "number") return screen.orientation.angle;
    if (typeof window.orientation === "number") return window.orientation;
    return 0;
  }
  function onOrient(e) {
    if (e.beta == null || e.gamma == null) return;
    const a = (screenAngle() % 360 + 360) % 360;
    let v;
    if (a === 90) v = e.beta;
    else if (a === 270) v = -e.beta;
    else if (a === 180) v = -e.gamma;
    else v = e.gamma;
    tiltValue = v;
    if (!tiltOn) {
      tiltOn = true;
      setTiltLabel(tr("tilt.on"), true);
    }
  }
  function setTiltLabel(text, on) {
    const b = $("tiltBtn");
    b.setAttribute("aria-label", text);
    b.title = text;
    b.classList.toggle("on", !!on);
  }
  async function enableTilt() {
    if (tiltAsked) return;
    tiltAsked = true;
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === "function") {
      try {
        const res = await DOE.requestPermission();
        if (res !== "granted") {
          setTiltLabel(tr("tilt.denied"), false);
          return;
        }
      } catch (e) {
        setTiltLabel(tr("tilt.err"), false);
        return;
      }
    }
    const Motion2 = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Motion;
    if (Motion2) {
      try {
        await Motion2.addListener("orientation", onOrient);
        return;
      } catch (e) {
      }
    }
    if (DOE) window.addEventListener("deviceorientation", onOrient);
    setTimeout(() => {
      if (!tiltOn) setTiltLabel(tr("tilt.none"), false);
    }, 1500);
  }
  function recenterTilt() {
    setTimeout(() => {
      tiltZero = tiltValue;
    }, 150);
  }
  $("tiltBtn").addEventListener("click", () => {
    if (tiltOn) {
      tiltZero = tiltValue;
      setTiltLabel(tr("tilt.reset"), true);
    } else {
      tiltAsked = false;
      enableTilt();
    }
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
    if (e.key === "Escape" || e.key === "p") togglePause();
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
  });
  cv.addEventListener("pointerdown", (e) => {
    dragX = e.clientX;
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (_) {
    }
  });
  cv.addEventListener("pointermove", (e) => {
    if (dragX !== null) dragX = e.clientX;
  });
  const endDrag = () => {
    dragX = null;
  };
  cv.addEventListener("pointerup", endDrag);
  cv.addEventListener("pointercancel", endDrag);
  function starSpans(n) {
    return [0, 1, 2].map((k) => `<span class="${k < n ? "on" : ""}">\u2605</span>`).join("");
  }
  function nextStage() {
    for (let i = 0; i < STAGES.length; i++) if (save.stars[i] === 0) return unlocked(i) ? i : i - 1;
    return STAGES.length - 1;
  }
  const ROW = 122, MAP_TOP = 80, MAP_BOTTOM = 230;
  const nodeX = (i) => 50 + Math.sin(i * 1.15 + 0.4) * 27;
  const nodeY = (i) => MAP_TOP + (STAGES.length - 1 - i) * ROW;
  let selIdx = -1;
  function buildSelect() {
    const map = $("stageGrid");
    const h = MAP_TOP + (STAGES.length - 1) * ROW + MAP_BOTTOM;
    map.style.height = h + "px";
    let d = "";
    for (let i = 0; i < STAGES.length; i++) {
      const x = nodeX(i), y = nodeY(i);
      if (i === 0) d += `M${x} ${y}`;
      else {
        const py = nodeY(i - 1), my = (py + y) / 2;
        d += ` C${nodeX(i - 1)} ${my} ${x} ${my} ${x} ${y}`;
      }
    }
    const nx = nextStage();
    let dDone = "";
    for (let i = 0; i <= Math.max(0, nx); i++) {
      const x = nodeX(i), y = nodeY(i);
      if (i === 0) dDone += `M${x} ${y}`;
      else {
        const py = nodeY(i - 1), my = (py + y) / 2;
        dDone += ` C${nodeX(i - 1)} ${my} ${x} ${my} ${x} ${y}`;
      }
    }
    map.innerHTML = `<svg viewBox="0 0 100 ${h}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${d}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="22" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <path d="${d}" fill="none" stroke="#b6e6ef" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      <path d="${dDone}" fill="none" stroke="#ffd84a" stroke-width="7" stroke-dasharray="2 12" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    </svg>`;
    STAGES.forEach((s2, i) => {
      const open = unlocked(i);
      const b = document.createElement("button");
      b.type = "button";
      b.id = "stageBtn" + i;
      b.className = "node" + (s2.boss ? " boss" : "") + (!open ? " locked" : save.stars[i] > 0 ? " cleared" : " next");
      b.disabled = !open;
      b.style.left = nodeX(i) + "%";
      b.style.top = nodeY(i) + "px";
      b.innerHTML = `<span class="disc">${open ? s2.boss ? "\u{1F451}" : i + 1 : "\u{1F512}"}</span><span class="name">${open ? STAGE_MARK : "\uFF1F\uFF1F\uFF1F"}</span><span class="st">${starSpans(save.stars[i])}</span>`;
      b.setAttribute("aria-label", open ? tr("stageAria", { n: i + 1, name: STAGE_MARK, s: save.stars[i] }) : tr("lockedAria", { n: i + 1 }));
      b.addEventListener("click", () => openSheet(i));
      map.appendChild(b);
    });
    const mk = document.createElement("canvas");
    mk.className = "marker";
    mk.width = 128;
    mk.height = 128;
    mk.style.left = `calc(${nodeX(nx)}% + 0px)`;
    mk.style.top = nodeY(nx) - (STAGES[nx].boss ? 44 : 36) + "px";
    drawCosmii({ x: 64, y: 78, w: 100, vx: 0, ouch: 0, happy: 1, stack: 0 }, 0, mk.getContext("2d"));
    map.appendChild(mk);
    return nx;
  }
  function openSheet(i) {
    selIdx = i;
    const s2 = STAGES[i];
    $("shNum").textContent = s2.boss ? "FINAL STAGE" : "STAGE " + (i + 1);
    $("shName").textContent = STAGE_MARK;
    $("shSub").textContent = L(s2, "sub");
    $("shStars").innerHTML = starSpans(save.stars[i]);
    const chips = [`<span class="chip">${tr("chipGoal", { n: s2.goal })}</span>`];
    if (s2.newThing) chips.push(`<span class="chip ${s2.boss ? "boss" : "new"}">${L(s2, "newThing")}</span>`);
    if (s2.intro) chips.push(`<span class="chip new">${L(s2, "intro")}</span>`);
    $("shChips").innerHTML = chips.join("");
    $("sheet").hidden = false;
    const sc = $("mapScroll");
    sc.scrollTo({ top: Math.max(0, nodeY(i) - sc.clientHeight * 0.3), behavior: "smooth" });
    $("shPlay").focus({ preventScroll: true });
  }
  function closeSheet() {
    $("sheet").hidden = true;
    selIdx = -1;
  }
  $("shClose").addEventListener("click", closeSheet);
  $("shPlay").addEventListener("click", async () => {
    if (selIdx < 0) return;
    const i = selIdx;
    closeSheet();
    await enableTilt();
    begin(i);
  });
  function refreshTitle() {
    const open = endlessOpen();
    $("endlessBtn").disabled = !open;
    $("endlessBtn").innerHTML = open ? `<span class="stack">ENDLESS<small>BEST ${save.best}</small></span>` : `<span class="lock">\u{1F512}</span><span class="stack">ENDLESS<small>${tr("endlessLock")}</small></span>`;
    $("ptsNum").textContent = save.pts;
    ensureDaily();
    const n = claimableCount();
    $("missionBadge").hidden = n === 0;
    $("missionBadge").textContent = n;
  }
  function toTitle() {
    running = false;
    paused = false;
    stopBgm();
    $("hud").hidden = true;
    $("banner").hidden = true;
    refreshTitle();
    show("titleScreen");
  }
  function toSelect() {
    running = false;
    paused = false;
    $("hud").hidden = true;
    $("banner").hidden = true;
    closeSheet();
    const nx = buildSelect();
    show("selectScreen");
    startBgm();
    const sc = $("mapScroll");
    sc.scrollTop = Math.max(0, nodeY(nx) - sc.clientHeight * 0.45);
    const btn = $("stageBtn" + nx);
    if (btn) btn.focus({ preventScroll: true });
  }
  const heroCv = $("heroCv"), hctx = heroCv.getContext("2d");
  const heroNegi = [0, 1, 2].map((i) => ({ x: 0.2 + i * 0.3, y: -0.3 - i * 0.45, k: i === 1 ? "gold" : "good" }));
  function drawHero(t, dt) {
    const w = heroCv.clientWidth, h = heroCv.clientHeight;
    if (!w || !h) return;
    if (heroCv.width !== Math.round(w * DPR) || heroCv.height !== Math.round(h * DPR)) {
      heroCv.width = Math.round(w * DPR);
      heroCv.height = Math.round(h * DPR);
    }
    hctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    hctx.clearRect(0, 0, w, h);
    const px = w / 2 + Math.sin(t * 1.1) * w * 0.28;
    for (const n of heroNegi) {
      n.y += dt * 0.55;
      if (n.y > 1.1) {
        n.y = -0.3;
        n.x = 0.15 + Math.random() * 0.7;
        n.k = Math.random() < 0.2 ? "gold" : "good";
      }
      drawNegi(hctx, n.x * w, n.y * h, Math.min(0.75, h / 260), n.k, Math.sin(t + n.x * 9) * 0.3, t);
    }
    const cw = Math.max(50, Math.min(120, h * 0.62));
    hctx.fillStyle = "rgba(43,143,163,.18)";
    hctx.beginPath();
    hctx.ellipse(px, h - cw * 0.1, cw * 0.5, cw * 0.07, 0, 0, 7);
    hctx.fill();
    drawCosmii({ x: px, y: h - cw * 0.48, w: cw, vx: Math.cos(t * 1.1) * 300, ouch: 0, happy: Math.sin(t * 2) > 0.6 ? 1 : 0, stack: 3 }, t, hctx);
  }
  function togglePause() {
    if (!running) return;
    paused = !paused;
    bgmPaused = paused;
    updateBgm();
    show(paused ? "pauseScreen" : null);
    if (paused) $("resumeBtn").focus();
  }
  let csNext = "map", csPick = "cosmii";
  function openCharSelect(next) {
    csNext = next;
    csPick = save.char;
    buildCharSelect();
    show("charScreen");
    $("csGo").focus();
  }
  function buildCharSelect() {
    const grid = $("csGrid");
    grid.innerHTML = "";
    Object.entries(COSMIIS).forEach(([key, ch2]) => {
      const owned2 = save.owned.includes("char:" + key);
      const b = document.createElement("button");
      b.type = "button";
      b.id = "cs_" + key;
      b.className = "cs-item" + (key === csPick ? " on" : "") + (owned2 ? "" : " locked");
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", key === csPick);
      b.setAttribute("aria-label", owned2 ? L(ch2, "name") : `${L(ch2, "name")}\uFF08${tr("cs.locked", { n: ch2.price })}\uFF09`);
      const cv3 = document.createElement("canvas");
      cv3.width = 120;
      cv3.height = 120;
      previewCosmii(cv3, owned2 ? save.hat : "none", owned2 ? save.basket : "brown", false, key);
      b.appendChild(cv3);
      if (!owned2) b.insertAdjacentHTML("beforeend", `<span class="lk">${COIN_IC}${ch2.price}</span>`);
      b.addEventListener("click", () => {
        csPick = key;
        buildCharSelect();
      });
      grid.appendChild(b);
    });
    const ch = COSMIIS[csPick], owned = save.owned.includes("char:" + csPick);
    const cv2 = $("csPreview"), c = cv2.getContext("2d");
    c.clearRect(0, 0, cv2.width, cv2.height);
    c.fillStyle = "rgba(43,143,163,.2)";
    c.beginPath();
    c.ellipse(cv2.width / 2, cv2.height - 30, 100, 14, 0, 0, 7);
    c.fill();
    if (!owned) c.globalAlpha = 0.45;
    drawCosmii({ x: cv2.width / 2, y: cv2.height * 0.64, w: 210, vx: 0, ouch: 0, happy: owned ? 1 : 0, stack: 3, char: csPick, hat: owned ? save.hat : "none", basket: owned ? save.basket : "brown" }, 0, c);
    c.globalAlpha = 1;
    $("csName").textContent = L(ch, "name");
    $("csAb").textContent = L(ch, "ab");
    $("csMsg").textContent = owned ? "" : tr("cs.locked", { n: ch.price });
    $("csGo").classList.toggle("locked", !owned);
    $("csGo").innerHTML = owned ? `<span>${tr("cs.go")}</span> <span class="arrow">\u2197</span>` : `<span>${tr("cs.shop")}</span>`;
  }
  $("csGo").addEventListener("click", async () => {
    if (!save.owned.includes("char:" + csPick)) {
      setShopTab("chars");
      openShop();
      return;
    }
    save.char = csPick;
    persist();
    if (csNext === "map") startBgm();
    await enableTilt();
    if (csNext === "endless") begin(-1);
    else toSelect();
  });
  $("charBackBtn").addEventListener("click", toTitle);
  $("toStagesBtn").addEventListener("click", () => openCharSelect("map"));
  $("endlessBtn").addEventListener("click", () => openCharSelect("endless"));
  $("selectBackBtn").addEventListener("click", toTitle);
  $("howtoBtn").addEventListener("click", () => {
    $("howtoScreen").hidden = false;
    $("howtoClose").focus();
  });
  $("howtoClose").addEventListener("click", () => {
    $("howtoScreen").hidden = true;
  });
  const NEGI_IC_OLD = '<svg class="negi-ic" viewBox="0 0 20 28" aria-hidden="true"><path d="M10 14V2M10 13C8 8 6 5 4 2M10 13c2-5 4-8 6-11" stroke="#3f8f22" stroke-width="3" stroke-linecap="round" fill="none"/><rect x="7" y="13" width="6" height="12" rx="3" fill="#f3f7e8" stroke="#8a6a55" stroke-width="1.2"/></svg>';
  let run = { pts: 0, negi: 0, gold: 0 };
  function todayKey() {
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  const LOGIN_REWARDS = [10, 15, 20, 25, 30, 40, 100];
  function checkLogin() {
    const today = todayKey();
    if (save.login.last === today) return false;
    save.login.last = today;
    save.login.days += 1;
    const idx = (save.login.days - 1) % 7;
    const reward = LOGIN_REWARDS[idx];
    save.pts += reward;
    persist();
    const grid = $("loginGrid");
    grid.innerHTML = LOGIN_REWARDS.map((r, i) => {
      const cls = ["lg-day", i < idx ? "done" : "", i === idx ? "today" : "", i === 6 ? "big" : ""].join(" ");
      return `<div class="${cls}">DAY ${i + 1}<b>${i < idx ? "\u2713" : r}</b><small>${i === 6 ? tr("login.bonus") : "Coin"}</small></div>`;
    }).join("");
    $("loginTitle").textContent = tr("login.title", { n: save.login.days });
    $("loginMsg").textContent = idx === 6 ? tr("login.big") : tr("login.msg", { n: reward });
    $("loginScreen").hidden = false;
    $("loginOk").focus();
    return true;
  }
  $("loginOk").addEventListener("click", () => {
    $("loginScreen").hidden = true;
    refreshTitle();
    if (!hasAskedForNotifs()) maybeAskNotifs();
  });
  const MISSIONS = [
    { id: "negi30", text: "\u30CD\u30AE\u309230\u672C\u30AD\u30E3\u30C3\u30C1", en: { text: "Catch 30 negi" }, type: "negi", target: 30, reward: 20 },
    { id: "negi80", text: "\u30CD\u30AE\u309280\u672C\u30AD\u30E3\u30C3\u30C1", en: { text: "Catch 80 negi" }, type: "negi", target: 80, reward: 45 },
    { id: "play3", text: "3\u56DE\u3042\u305D\u3076", en: { text: "Play 3 times" }, type: "play", target: 3, reward: 20 },
    { id: "clear2", text: "\u30B9\u30C6\u30FC\u30B8\u30922\u56DE\u30AF\u30EA\u30A2", en: { text: "Clear stages 2 times" }, type: "clear", target: 2, reward: 30 },
    { id: "star3", text: "\u26053\u3067\u30AF\u30EA\u30A2\u3059\u308B", en: { text: "Clear a stage with \u26053" }, type: "star3", target: 1, reward: 40 },
    { id: "gold3", text: "\u91D1\u306E\u30CD\u30AE\u30923\u672C\u30AD\u30E3\u30C3\u30C1", en: { text: "Catch 3 golden negi" }, type: "gold", target: 3, reward: 35, ok: () => save.stars[1] > 0 },
    { id: "end30", text: "ENDLESS\u306730\u70B9\u3068\u308B", en: { text: "Score 30 in Endless" }, type: "endless", target: 30, reward: 45, ok: () => endlessOpen() }
  ];
  const ALL_BONUS = 50;
  function seeded(str) {
    let h = 2166136261;
    for (const ch of str) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) % 1e4 / 1e4;
    };
  }
  function ensureDaily() {
    const today = todayKey();
    if (save.daily && save.daily.date === today) return;
    const rnd = seeded(today);
    const pool = MISSIONS.filter((m) => !m.ok || m.ok());
    const picks = [];
    const easy = pool.filter((m) => m.type === "play" || m.id === "negi30");
    picks.push(easy[Math.floor(rnd() * easy.length)]);
    while (picks.length < 3) {
      const m = pool[Math.floor(rnd() * pool.length)];
      if (!picks.some((p) => p.id === m.id || p.type === m.type)) picks.push(m);
    }
    save.daily = { date: today, ms: picks.map((m) => ({ id: m.id, p: 0, claimed: false })), bonus: false };
    persist();
  }
  const mDef = (id) => MISSIONS.find((m) => m.id === id);
  function missionEvent(type, amount) {
    ensureDaily();
    let changed = false;
    for (const m of save.daily.ms) {
      const d = mDef(m.id);
      if (!d || d.type !== type || m.p >= d.target) continue;
      m.p = type === "endless" ? Math.max(m.p, amount) : m.p + amount;
      if (m.p >= d.target) {
        m.p = d.target;
        if (running) flash(tr("ms.done"), "var(--gold)");
      }
      changed = true;
    }
    if (changed) persist();
  }
  function claimableCount() {
    if (!save.daily) return 0;
    let n = save.daily.ms.filter((m) => !m.claimed && m.p >= mDef(m.id).target).length;
    if (!save.daily.bonus && save.daily.ms.every((m) => m.claimed)) n++;
    return n;
  }
  function buildMissions() {
    ensureDaily();
    const list = $("msList");
    list.innerHTML = "";
    save.daily.ms.forEach((m, i) => {
      const d = mDef(m.id);
      const done = m.p >= d.target;
      const el = document.createElement("div");
      el.className = "ms" + (m.claimed ? " got" : "");
      el.innerHTML = `<div class="t">${L(d, "text")}<div class="r">${COIN_IC} ${d.reward} Cosmo Coin</div></div>
        <button class="claim" type="button" id="msClaim${i}" ${done && !m.claimed ? "" : "disabled"}>${m.claimed ? tr("claimed") : done ? tr("claim") : tr("notyet")}</button>
        <div class="bar"><i style="width:${Math.min(100, m.p / d.target * 100)}%"></i></div>
        <div class="pg">${Math.min(m.p, d.target)}/${d.target}</div>`;
      list.appendChild(el);
      el.querySelector("button").addEventListener("click", () => {
        if (m.claimed || m.p < d.target) return;
        m.claimed = true;
        save.pts += d.reward;
        persist();
        buildMissions();
        refreshTitle();
      });
    });
    const allClaimed = save.daily.ms.every((m) => m.claimed);
    const box = $("msBonus");
    if (save.daily.bonus) box.innerHTML = tr("ms.bonusGot");
    else if (allClaimed) {
      box.innerHTML = `<button class="play" id="msBonusBtn" type="button">${tr("ms.bonusBtn", { n: ALL_BONUS })}</button>`;
      $("msBonusBtn").addEventListener("click", () => {
        save.daily.bonus = true;
        save.pts += ALL_BONUS;
        persist();
        buildMissions();
        refreshTitle();
      });
    } else box.textContent = tr("ms.bonusHint", { n: ALL_BONUS });
  }
  $("missionBtn").addEventListener("click", () => {
    buildMissions();
    $("missionScreen").hidden = false;
    $("missionClose").focus();
  });
  $("missionClose").addEventListener("click", () => {
    $("missionScreen").hidden = true;
    refreshTitle();
  });
  function previewCosmii(cv2, hat, basket, big, char) {
    const c = cv2.getContext("2d");
    c.clearRect(0, 0, cv2.width, cv2.height);
    char = char || save.char;
    if (big) {
      c.fillStyle = "rgba(43,143,163,.18)";
      c.beginPath();
      c.ellipse(cv2.width / 2, cv2.height - 26, 90, 12, 0, 0, 7);
      c.fill();
      drawCosmii({ x: cv2.width / 2, y: cv2.height * 0.62, w: 200, vx: 0, ouch: 0, happy: 1, stack: 3, hat, basket, char }, 0, c);
    } else {
      drawCosmii({ x: cv2.width / 2, y: cv2.height * 0.68, w: cv2.width * 0.74, vx: 0, ouch: 0, happy: 0, stack: 0, hat, basket, char }, 0, c);
    }
  }
  let shopTab = "chars";
  function setShopTab(tab) {
    shopTab = tab;
    $("tabChars").classList.toggle("on", tab === "chars");
    $("tabDress").classList.toggle("on", tab === "dress");
    $("tabChars").setAttribute("aria-selected", tab === "chars");
    $("tabDress").setAttribute("aria-selected", tab === "dress");
    $("paneChars").hidden = tab !== "chars";
    $("paneDress").hidden = tab !== "dress";
  }
  $("tabChars").addEventListener("click", () => setShopTab("chars"));
  $("tabDress").addEventListener("click", () => setShopTab("dress"));
  function buildChars() {
    const wrap = $("shopChars");
    wrap.innerHTML = "";
    Object.entries(COSMIIS).forEach(([key, ch]) => {
      const id = "char:" + key;
      const owned = save.owned.includes(id);
      const on = save.char === key;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "citem" + (on ? " on" : owned ? " owned" : save.pts < ch.price ? " cant" : "");
      const cv2 = document.createElement("canvas");
      cv2.width = 168;
      cv2.height = 168;
      previewCosmii(cv2, "none", "brown", false, key);
      b.appendChild(cv2);
      b.insertAdjacentHTML("beforeend", `<span class="cn">${L(ch, "name")}</span><span class="ab">${L(ch, "ab")}</span><span class="price">${on ? tr("shop.on") : owned ? tr("shop.owned") : COIN_IC + ch.price}</span>`);
      b.setAttribute("aria-label", `${L(ch, "name")}\u3001${L(ch, "ab")}\u3001${on ? tr("shop.on") : owned ? tr("shop.owned") : ch.price + " Cosmo Coin"}`);
      b.addEventListener("click", () => {
        if (!owned) {
          if (save.pts < ch.price) {
            b.classList.remove("shake");
            void b.offsetWidth;
            b.classList.add("shake");
            $("shopMsg").textContent = tr("shop.short", { n: ch.price - save.pts });
            return;
          }
          save.pts -= ch.price;
          save.owned.push(id);
        }
        save.char = key;
        persist();
        buildShop(owned ? tr("shop.wear", { name: L(ch, "name") }) : tr("shop.got", { name: L(ch, "name") }));
        refreshTitle();
      });
      wrap.appendChild(b);
    });
  }
  function buildShop(msg) {
    $("shopPts").textContent = save.pts;
    previewCosmii($("shopPreview"), save.hat, save.basket, true);
    buildChars();
    const fill = (wrap, table, kind) => {
      wrap.innerHTML = "";
      Object.entries(table).forEach(([key, it]) => {
        const id = kind + ":" + key;
        const owned = save.owned.includes(id);
        const on = (kind === "hat" ? save.hat : save.basket) === key;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "item" + (on ? " on" : owned ? " owned" : save.pts < it.price ? " cant" : "");
        const cv2 = document.createElement("canvas");
        cv2.width = 112;
        cv2.height = 88;
        previewCosmii(cv2, kind === "hat" ? key : save.hat, kind === "basket" ? key : save.basket, false);
        b.appendChild(cv2);
        b.insertAdjacentHTML("beforeend", `<span>${L(it, "name")}</span><span class="price">${on ? tr("shop.on") : owned ? tr("shop.owned") : COIN_IC + it.price}</span>`);
        b.setAttribute("aria-label", `${L(it, "name")} ${on ? tr("shop.on") : owned ? tr("shop.owned") : it.price + " Cosmo Coin"}`);
        b.addEventListener("click", () => {
          if (!owned) {
            if (save.pts < it.price) {
              b.classList.remove("shake");
              void b.offsetWidth;
              b.classList.add("shake");
              $("shopMsg").textContent = tr("shop.short", { n: it.price - save.pts });
              return;
            }
            save.pts -= it.price;
            save.owned.push(id);
          }
          if (kind === "hat") save.hat = key;
          else save.basket = key;
          persist();
          buildShop(owned ? tr("shop.wear", { name: L(it, "name") }) : tr("shop.got", { name: L(it, "name") }));
          refreshTitle();
        });
        wrap.appendChild(b);
      });
    };
    fill($("shopHats"), HATS, "hat");
    fill($("shopBaskets"), BASKETS, "basket");
    $("shopMsg").textContent = msg || tr("shop.hint");
  }
  const openShop = () => {
    setShopTab(shopTab);
    buildShop();
    $("shopScreen").hidden = false;
    $("shopClose").focus();
  };
  $("shopBtn").addEventListener("click", openShop);
  $("ptsPill").addEventListener("click", openShop);
  $("shopClose").addEventListener("click", () => {
    $("shopScreen").hidden = true;
    if (!$("charScreen").hidden) buildCharSelect();
  });
  const SNS_LINKS = [
    { key: "line", label: "LINE\u30B9\u30BF\u30F3\u30D7", note: "Cosmii\u306E\u30B9\u30BF\u30F3\u30D7\u3092\u898B\u308B", en: { label: "LINE Stickers", note: "See the Cosmii stickers" }, url: "https://store.line.me/", icon: "LINE", color: "#06c755" },
    { key: "x", label: "X", note: "\u6700\u65B0\u60C5\u5831\u3092\u30C1\u30A7\u30C3\u30AF", en: { note: "Latest news" }, url: "https://x.com/airis_games?s=11&t=N8tqwlfetk6wUOMXXpX33A", icon: "\u{1D54F}", color: "#111111" },
    { key: "ig", label: "Instagram", note: "Cosmii\u306E\u5199\u771F\u3084\u30A4\u30E9\u30B9\u30C8", en: { note: "Cosmii photos and art" }, url: "https://www.instagram.com/airis_games_official?srtk=MXRzeWV3dmlhMmNpMA%3D%3D", icon: "IG", color: "#e1306c" },
    { key: "tt", label: "TikTok", note: "\u30D7\u30EC\u30A4\u52D5\u753B\u306A\u3069", en: { note: "Gameplay videos and more" }, url: "https://www.tiktok.com/@airis_games_official?_r=1&_t=ZS-9AzXRn5cpXg", icon: "\u266A", color: "#222222" }
  ];
  function buildSns() {
    const list = $("snsList");
    list.innerHTML = "";
    SNS_LINKS.filter((l) => l.url).forEach((l) => {
      const a = document.createElement("a");
      a.className = "sns-row" + (l.key === "line" ? " line" : "");
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `<span class="ic" style="background:${l.color}">${l.icon}</span><span class="tx">${L(l, "label")}<small>${L(l, "note")}</small></span><span class="chev">\u203A</span>`;
      list.appendChild(a);
    });
  }
  $("snsBtn").addEventListener("click", () => {
    buildSns();
    $("snsScreen").hidden = false;
    $("snsClose").focus();
  });
  $("snsClose").addEventListener("click", () => {
    $("snsScreen").hidden = true;
  });
  const CHARS = [
    { name: "\u30CD\u30AE", sub: "Cosmii\u306E\u5927\u597D\u7269\u3002\u30B7\u30E3\u30AD\u30B7\u30E3\u30AD", en: { name: "Negi", sub: "Cosmii's favorite. Nice and crunchy" }, kind: "good", got: () => true },
    { name: "\u8150\u3063\u305F\u30CD\u30AE", sub: "\u304F\u3055\u3044\uFF01\u53D6\u308B\u3068\u30CF\u30FC\u30C8\u304C\u6E1B\u308B", en: { name: "Rotten Negi", sub: "Stinky! Costs you a heart" }, kind: "rot", got: () => save.stars[1] > 0 },
    { name: "\u91D1\u306E\u30CD\u30AE", sub: "\u3081\u3063\u305F\u306B\u843D\u3061\u3066\u3053\u306A\u3044\u30023\u672C\u3076\u3093", en: { name: "Golden Negi", sub: "Rare. Counts as 3" }, kind: "gold", got: () => save.stars[2] > 0 },
    { name: "\u30CD\u30AE\u5927\u738B", sub: "\u30CD\u30AE\u7551\u3092\u304A\u3055\u3081\u308B\u738B\u3055\u307E", en: { name: "Negi King", sub: "Ruler of the negi fields" }, kind: "king", got: () => save.stars[9] > 0 }
  ];
  function cardCanvas(draw) {
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 240;
    draw(c.getContext("2d"), 240);
    return c;
  }
  function paintPref(x, S, st, locked) {
    const g = x.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, locked ? "#cfe9ef" : st.sky[0]);
    g.addColorStop(1, locked ? "#e3f4f7" : st.sky[1]);
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    if (!locked) {
      x.fillStyle = "rgba(255,255,255,.8)";
      for (let i = 0; i < 18; i++) {
        x.beginPath();
        x.arc(i * 53 % S, i * 37 % (S * 0.6), 1.6, 0, 7);
        x.fill();
      }
      x.fillStyle = st.orb;
      x.beginPath();
      x.arc(S * 0.78, S * 0.22, S * 0.09, 0, 7);
      x.fill();
    }
    x.fillStyle = locked ? "#b8dbe3" : st.ground;
    x.beginPath();
    x.moveTo(0, S * 0.72);
    for (let i = 0; i <= S; i += 20) x.lineTo(i, S * 0.72 + Math.sin(i * 0.04) * 5);
    x.lineTo(S, S);
    x.lineTo(0, S);
    x.fill();
    if (locked) {
      x.fillStyle = "#9fcbd5";
      x.font = '400 90px "Rammetto One", sans-serif';
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("?", S / 2, S * 0.44);
    } else {
      drawNegi(x, S * 0.5, S * 0.6, 1.9, st.boss ? "gold" : "good", -0.08, 1);
    }
  }
  function paintChar(x, S, ch, locked) {
    x.fillStyle = locked ? "#e3f4f7" : "#eaf8fb";
    x.fillRect(0, 0, S, S);
    x.fillStyle = locked ? "#cfe9ef" : "#d4f1f7";
    x.beginPath();
    x.arc(S / 2, S / 2 + 10, S * 0.36, 0, 7);
    x.fill();
    if (locked) {
      x.fillStyle = "#9fcbd5";
      x.font = '400 90px "Rammetto One", sans-serif';
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText("?", S / 2, S / 2 + 6);
      return;
    }
    if (ch.kind === "king") {
      drawNegi(x, S / 2, S * 0.56, 2.2, "good", 0, 1);
      x.fillStyle = "#ffd55a";
      x.beginPath();
      x.moveTo(S / 2 - 26, S * 0.47);
      x.lineTo(S / 2 - 26, S * 0.37);
      x.lineTo(S / 2 - 13, S * 0.43);
      x.lineTo(S / 2, S * 0.34);
      x.lineTo(S / 2 + 13, S * 0.43);
      x.lineTo(S / 2 + 26, S * 0.37);
      x.lineTo(S / 2 + 26, S * 0.47);
      x.closePath();
      x.fill();
      x.fillStyle = "#1a1240";
      x.beginPath();
      x.arc(S / 2 - 6, S * 0.6, 2.6, 0, 7);
      x.arc(S / 2 + 6, S * 0.6, 2.6, 0, 7);
      x.fill();
    } else {
      drawNegi(x, S / 2, S * 0.58, 2.2, ch.kind, -0.1, 1);
    }
  }
  function buildZukan() {
    const chars = $("zkChars"), prefs = $("zkPrefs");
    chars.innerHTML = "";
    prefs.innerHTML = "";
    let gotC = 0, gotP = 0;
    CHARS.forEach((ch, i) => {
      const got = ch.got();
      if (got) gotC++;
      const el = document.createElement("div");
      el.className = "zk-card" + (got ? "" : " locked");
      el.appendChild(cardCanvas((x, S) => paintChar(x, S, ch, !got)));
      el.insertAdjacentHTML("beforeend", `<div class="no">No.${String(i + 1).padStart(2, "0")}</div><div class="zn">${got ? L(ch, "name") : "\uFF1F\uFF1F\uFF1F"}</div><div class="zs">${got ? L(ch, "sub") : tr("zk.notyet")}</div>`);
      chars.appendChild(el);
    });
    STAGES.forEach((st, i) => {
      const got = save.stars[i] > 0;
      if (got) gotP++;
      const el = document.createElement("div");
      el.className = "zk-card" + (got ? "" : " locked");
      el.appendChild(cardCanvas((x, S) => paintPref(x, S, st, !got)));
      el.insertAdjacentHTML("beforeend", `<div class="no">STAGE ${i + 1}</div><div class="zn">${got ? STAGE_MARK : "\uFF1F\uFF1F\uFF1F"}</div><div class="zs">${got ? L(st, "sub") : tr("zk.clearToAdd")}</div><div class="st">${starSpans(save.stars[i])}</div>`);
      prefs.appendChild(el);
    });
    const cos = $("zkCos");
    cos.innerHTML = "";
    let gotK = 0;
    Object.entries(COSMIIS).forEach(([key, ch], i) => {
      const got = save.owned.includes("char:" + key);
      if (got) gotK++;
      const el = document.createElement("div");
      el.className = "zk-card" + (got ? "" : " locked");
      el.appendChild(cardCanvas((x, S) => {
        x.fillStyle = got ? "#eaf8fb" : "#e3f4f7";
        x.fillRect(0, 0, S, S);
        x.fillStyle = got ? "#d4f1f7" : "#cfe9ef";
        x.beginPath();
        x.arc(S / 2, S / 2 + 10, S * 0.36, 0, 7);
        x.fill();
        if (got) drawCosmii({ x: S / 2, y: S * 0.6, w: S * 0.62, vx: 0, ouch: 0, happy: 0, stack: 0, hat: "none", basket: "brown", char: key }, 0, x);
        else {
          x.fillStyle = "#9fcbd5";
          x.font = '400 90px "Rammetto One", sans-serif';
          x.textAlign = "center";
          x.textBaseline = "middle";
          x.fillText("?", S / 2, S / 2 + 6);
        }
      }));
      el.insertAdjacentHTML("beforeend", `<div class="no">No.${String(i + 1).padStart(2, "0")}</div><div class="zn">${got ? L(ch, "name") : "\uFF1F\uFF1F\uFF1F"}</div>`);
      cos.appendChild(el);
    });
    const nK = Object.keys(COSMIIS).length;
    $("zkCosCount").textContent = `${gotK}/${nK}`;
    $("zukanTotal").textContent = nK + CHARS.length + STAGES.length;
    $("zkCharCount").textContent = `${gotC}/${CHARS.length}`;
    $("zkPrefCount").textContent = `${gotP}/${STAGES.length}`;
    $("zukanCount").textContent = gotK + gotC + gotP;
  }
  $("zukanBtn").addEventListener("click", () => {
    buildZukan();
    show("zukanScreen");
    $("zukanBackBtn").focus();
  });
  $("zukanBackBtn").addEventListener("click", toTitle);
  $("pauseBtn").addEventListener("click", togglePause);
  $("resumeBtn").addEventListener("click", togglePause);
  $("retryBtn").addEventListener("click", () => begin(curIndex));
  $("quitBtn").addEventListener("click", () => cur.endless ? toTitle() : toSelect());
  $("nextBtn").addEventListener("click", () => begin(curIndex + 1));
  $("clearRetryBtn").addEventListener("click", () => begin(curIndex));
  $("clearSelectBtn").addEventListener("click", toSelect);
  $("againBtn").addEventListener("click", () => begin(curIndex));
  $("overBackBtn").addEventListener("click", () => cur.endless ? toTitle() : toSelect());
  $("clearShareBtn").addEventListener("click", shareResult);
  $("overShareBtn").addEventListener("click", shareResult);
  $("clearXPostBtn").addEventListener("click", postResultToX);
  $("overXPostBtn").addEventListener("click", postResultToX);
  $("rankBtn").addEventListener("click", () => gcShow());
  $("clearRankBtn").addEventListener("click", () => gcShow(LEADERBOARD.stars));
  $("overRankBtn").addEventListener("click", () => gcShow(cur.endless ? LEADERBOARD.endless : LEADERBOARD.stars));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && running && !paused) togglePause();
    if (document.hidden) scheduleReminders();
  });
  $("notifYes").addEventListener("click", async () => {
    $("notifScreen").hidden = true;
    if (!await turnOnNotifs()) flash(tr("nt.denied"), "var(--brown)");
  });
  $("notifNo").addEventListener("click", () => {
    $("notifScreen").hidden = true;
  });
  $("soundBtn").addEventListener("click", () => {
    save.sound = !save.sound;
    persist();
    updateSoundBtn();
    updateBgm();
    if (save.sound) playSound("catch");
  });
  $("notifBtn").addEventListener("click", async () => {
    if (save.notif) {
      save.notif = false;
      persist();
      cancelReminders();
      updateNotifBtn();
      return;
    }
    const ok = await turnOnNotifs();
    if (!ok) {
      $("notifBtn").title = tr("nt.denied");
      flash("\u{1F515}", "var(--brown)");
    }
  });
  let wakeLock = null;
  async function requestWake() {
    try {
      if ("wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
        });
      }
    } catch (e) {
    }
  }
  function update(dt, t) {
    const p = player;
    const maxSpeed = W * 1.5;
    let target;
    if (dragX !== null) target = Math.max(-maxSpeed, Math.min(maxSpeed, (dragX - p.x) * 12));
    else if (keys.left || keys.right) target = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * maxSpeed * 0.7;
    else if (tiltOn) {
      let v = tiltValue - tiltZero;
      const dead = 2.5;
      v = Math.abs(v) < dead ? 0 : v - Math.sign(v) * dead;
      target = Math.max(-1, Math.min(1, v / 22)) * maxSpeed * 0.85;
    } else target = 0;
    const grip = cur.ice && power() !== "grip" ? 2.2 : 14;
    p.vx += (target - p.vx) * Math.min(1, dt * grip);
    p.x += p.vx * dt;
    const half = p.w / 2;
    if (p.x < half) {
      p.x = half;
      p.vx = cur.ice ? -p.vx * 0.4 : 0;
    }
    if (p.x > W - half) {
      p.x = W - half;
      p.vx = cur.ice ? -p.vx * 0.4 : 0;
    }
    if (p.ouch > 0) p.ouch -= dt;
    if (p.happy > 0) p.happy -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += 500 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    if (boss) {
      const sp = W * (0.18 + Math.min(1, caught / cur.goal) * 0.25);
      boss.x += boss.dir * sp * dt;
      const m = W * 0.12;
      if (boss.x < m) {
        boss.x = m;
        boss.dir = 1;
      }
      if (boss.x > W - m) {
        boss.x = W - m;
        boss.dir = -1;
      }
      if (Math.random() < dt * 0.6) boss.dir *= -1;
      if (boss.angry > 0) boss.angry -= dt;
    }
    windNow = cur.wind ? cur.wind * Math.sin(t * 0.4) + cur.wind * 0.5 * Math.sin(t * 1.3) : 0;
    if (introTimer > 0) {
      introTimer -= dt;
      if (introTimer <= 0) $("banner").hidden = true;
      return;
    }
    spawnTimer -= dt;
    if (spawnTimer <= 0) spawn();
    const catchTop = p.y - p.w * 0.12;
    const catchHalf = p.w * 0.46;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy * dt;
      it.sway += dt * 2;
      it.x += Math.sin(it.sway) * 12 * dt;
      if (cur.wind) it.x += windNow * dt;
      if (cur.hole) it.x += (holeX(t) - it.x) * 0.55 * dt;
      it.x = Math.max(20, Math.min(W - 20, it.x));
      it.rot += it.spin * dt * 0.4;
      const bottom = it.y + 30;
      if (bottom >= catchTop && bottom <= catchTop + 28 && Math.abs(it.x - p.x) < catchHalf) {
        items.splice(i, 1);
        if (it.kind === "rot" && guardLeft > 0) {
          guardLeft--;
          burst(it.x, catchTop, "#d6b3ff", 16);
          flash(tr("f.guard"), "#d6b3ff");
          continue;
        }
        if (it.kind === "rot") {
          lives--;
          p.ouch = 0.6;
          renderLives();
          burst(it.x, catchTop, "#8a5a2b", 14);
          flash(tr("f.rot"), "var(--danger)");
          playSound("miss");
          if (navigator.vibrate) try {
            navigator.vibrate(120);
          } catch (e) {
          }
          if (lives <= 0) {
            gameOver();
            return;
          }
        } else {
          const gold = it.kind === "gold";
          playSound(gold ? "gold" : "catch");
          const pts = gold ? cur.endless ? 5 : 3 : 1;
          score += pts;
          caught += gold ? 3 : 1;
          p.stack++;
          p.happy = 0.3;
          run.pts += gold ? 3 : 1;
          run.negi++;
          if (gold) run.gold++;
          missionEvent("negi", 1);
          if (gold) missionEvent("gold", 1);
          burst(it.x, catchTop, gold ? "#ffd55a" : "#7fdc4a", gold ? 18 : 8);
          if (gold) flash("+" + pts, "var(--gold)");
          if (cur.endless) {
            const next = Math.min(STAGES.length - 1, Math.floor(score / AREA_EVERY));
            if (next !== areaIdx) {
              areaIdx = next;
              arrive(STAGES[areaIdx]);
            }
          }
          renderHud();
          if (!cur.endless && caught >= cur.goal) {
            stageClear();
            return;
          }
        }
        continue;
      }
      if (it.y - 50 > H) {
        items.splice(i, 1);
        if (it.kind !== "rot") {
          lives--;
          renderLives();
          flash(tr("f.drop"), "#d8f4fa");
          playSound("miss");
          if (lives <= 0) {
            gameOver();
            return;
          }
        }
      }
    }
    elapsed += dt;
  }
  function render(t, dt) {
    drawBackground(theme(), t);
    drawWeather(cur, dt);
    if (boss) drawBoss(boss, t);
    const s2 = Math.max(0.85, Math.min(1.3, W / 700));
    for (const it of items) drawNegi(ctx, it.x, it.y, s2, it.kind, it.rot, t);
    for (const q of particles) {
      ctx.globalAlpha = Math.max(0, q.life / 0.6);
      ctx.fillStyle = q.color;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 3, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (player) drawCosmii(player, t);
  }
  function loop(ts) {
    const t = ts / 1e3;
    const dt = Math.min(0.033, lastT ? t - lastT : 0);
    lastT = t;
    if (!player) player = newPlayer();
    if (running && !paused) update(dt, t);
    else if (!running) {
      player.x = W / 2 + Math.sin(t * 0.8) * W * 0.18;
      player.vx = Math.cos(t * 0.8) * W * 0.14;
    }
    if (!$("splashScreen").hidden) {
    } else if (!$("titleScreen").hidden) drawHero(t, dt);
    else if ($("selectScreen").hidden && $("zukanScreen").hidden && $("charScreen").hidden) render(t, running && !paused ? dt : 0);
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", resize);
  resize();
  let splashDone = false;
  async function leaveSplash() {
    if (splashDone) return;
    splashDone = true;
    enableTilt();
    toTitle();
    const loginShown = checkLogin();
    if (!loginShown && !hasAskedForNotifs()) maybeAskNotifs();
    if (save.notif) await scheduleReminders();
  }
  $("splashScreen").addEventListener("click", leaveSplash);
  $("splashScreen").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      leaveSplash();
    }
  });
  $("langBtn").addEventListener("click", () => {
    LANG = LANG === "ja" ? "en" : "ja";
    save.lang = LANG;
    persist();
    applyI18n();
    refreshTitle();
    updateNotifBtn();
    updateSoundBtn();
    scheduleReminders();
    updateBgm();
    setTiltLabel(tiltOn ? tr("tilt.on") : tr("tilt.off"), tiltOn);
  });
  applyI18n();
  updateNotifBtn();
  updateSoundBtn();
  setTiltLabel(tr("tilt.off"), false);
  refreshTitle();
  gcSignIn();
  requestAnimationFrame(loop);
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
