module Hawtio {

  export interface PluginLoaderStatic {

    parseQueryString():any;

    addModule(module:String);
    addUrl(url:String);

    getModules():String[];

    loadPlugins(callback: () => void);
    debug();

  };

};

declare var hawtioPluginLoader: Hawtio.PluginLoaderStatic;
