// ==UserScript==
// @name           Jayun's ExLuogu
// @namespace      http://tampermonkey.net/
// @version        3.0.0
//
// @match          https://*.luogu.com.cn/*
// @match          https://*.luogu.org/*
// @match          https://www.bilibili.com/robots.txt?*
// @match          https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121
// @match          https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen
// @match          https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting
// @match          https://extend-luogu.github.io/exlg-setting/*
// @match          http://localhost:1634/*
//
// @connect        tencentcs.com
// @connect        luogulo.gq
// @connect        bens.rotriw.com
// @connect        fanyi.youdao.com
// @connect        codeforces.com
// @connect        v1.jinrishici.com
//
// @require        https://cdn.luogu.com.cn/js/jquery-2.1.1.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/js-xss/0.3.3/xss.min.js
// @require        https://cdn.bootcdn.net/ajax/libs/marked/2.0.1/marked.min.js
// @require        https://cdn.luogu.com.cn/js/highcharts.js
// @require        https://cdn.luogu.com.cn/js/highcharts-more.js
// @require        https://cdn.jsdelivr.net/gh/ForkKILLET/TM-dat@main/TM-dat.user.js
//
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          GM_setClipboard
// @grant          GM_xmlhttpRequest
// @grant          unsafeWindow
// ==/UserScript==

// ==Update==

const update_log = `*M user-problem-color
 : 调整黑题颜色
*M update-log
^< eslint
*@ commit-std`

// ==/Update==

// ==Utilities==

const uindow = unsafeWindow

const log = (f, ...s) => uindow.console.log(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const warn = (f, ...s) => uindow.console.warn(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const error = (f, ...s) => {
    uindow.console.error(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
    throw Error(s.join(" "))
}

// ==Utilities==Libraries==

const $ = jQuery
const xss = new filterXSS.FilterXSS({
    onTagAttr: (_, k, v) => {
        if (k === "style") return `${k}="${v}"`
    }
})
const mdp = uindow.markdownPalettes
$.double = (func, first, second) => [func(first), func(second)]

// ==Utilities==Extensions==

Date.prototype.format = function (f, UTC) {
    UTC = UTC ? "UTC" : ""
    const re = {
        "y+": this[`get${UTC}FullYear`](),
        "m+": this[`get${UTC}Month`]() + 1,
        "d+": this[`get${UTC}Date`](),
        "H+": this[`get${UTC}Hours`](),
        "M+": this[`get${UTC}Minutes`](),
        "S+": this[`get${UTC}Seconds`](),
        "s+": this[`get${UTC}Milliseconds`]()
    }
    for (const r in re) if (RegExp(`(${r})`).test(f))
        f = f.replace(RegExp.$1,
            ("000" + re[r]).substr(re[r].toString().length + 3 - RegExp.$1.length)
        )
    return f
}

String.prototype.toInitialCase = function () {
    return this[0].toUpperCase() + this.slice(1)
}

// ==Utilities==Functions==

let sto = null

const version_cmp = (v1, v2) => {
    if (! v1) return "<<"

    const op = (x1, x2) => x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>"
    const exs = [ "pre", "alpha", "beta" ]

    const [ [ n1, e1 ], [ n2, e2 ] ] = [ v1, v2 ].map(v => v.split(" "))
    if (n1 === n2) return op(...[ e1, e2 ].map(e => e ? exs.findIndex(ex => ex === e) : Infinity))

    const [ m1, m2 ] = [ n1, n2 ].map(n => n.split("."))
    for (const [ k2, m ] of m1.entries())
        if (m !== m2[k2]) return op(+ m || 0, + m2[k2] || 0)
}

const lg_content = url => new Promise((res, rej) =>
    $.get(url + (url.includes("?") ? "&" : "?") + "_contentOnly=1", data => {
        if (data.code !== 200) rej(`Requesting failure code: ${ res.code }.`)
        res(data)
    })
)

const lg_alert = uindow.show_alert
    ? (msg, title = "exlg 提醒您") => uindow.show_alert(title, msg)
    : (msg, title = "exlg 提醒您") => {
        if (! $(document.body).hasClass("lg-alert-built")) {
            $(`<div class="am-modal am-modal-alert am-modal-out" tabindex="-1" id="exlg-alert" style="display: none; margin-top: -40px;">
            <div class="am-modal-dialog">
                <div class="am-modal-hd" id="exlg-alert-title"></div>
                <div class="am-modal-bd" id="exlg-alert-message"></div>
                <div class="am-modal-footer">
                    <span class="am-modal-btn">确定</span>
                </div>
            </div></div>`).appendTo($(document.body))
            $(document.body).addClass("lg-alert-built")
        }
        $("#exlg-alert-title").html(title)
        $("#exlg-alert-message").html(msg)
        $("#exlg-alert").modal("open")
    }

/*
// Note: not implemented yet
const lg_confirm = (deny, accept, title, msg, callback) => {
    if (! $(document.body).hasClass("lg-confirm-built")) {
        $(`<div class="am-modal am-modal-confirm am-modal-out" tabindex="-1" id="exlg-confirm" style="display: none; margin-top: -40px;">
        <div class="am-modal-dialog">
            <div class="am-modal-hd" id="exlg-confirm-title"></div>
            <div class="am-modal-bd" id="exlg-confirm-message"></div>
            <div class="am-modal-footer">
                <span class="am-modal-btn" id="exlg-confirm-deny" data-am-modal-cancel></span>
                <span class="am-modal-btn" id="exlg-confirm-accept" data-am-modal-confirm></span>
            </div>
        </div></div>`).appendTo($(document.body))
        $(document.body).addClass("lg-confirm-built")
    }
    $("#exlg-confirm-title").html(title)
    $("#exlg-confirm-message").html(msg)
    $("#exlg-confirm-deny")
        .html(deny)
        .on("click", callback(false))
    $("#exlg-confirm-accept")
        .html(accept)
        .on("click", callback(true))
    $("#exlg-confirm").modal("open") // Hack: exlg is loaded before boostrap so it'll crash
}
*/

const springboard = (param, styl) => {
    const q = new URLSearchParams(); for (let k in param) q.set(k, param[k])
    const $sb = $(`
        <iframe id="exlg-${param.type}" src=" https://www.bilibili.com/robots.txt?${q}" style="${styl}" exlg="exlg"></iframe>
    `)
    log("Building springboard: %o", $sb[0])
    return $sb
}

const judge_problem = text => [
    /^AT[1-9][0-9]{0,}$/i,
    /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
    /^SP[1-9][0-9]{0,}$/i,
    /^P[1-9][0-9]{3,}$/i,
    /^UVA[1-9][0-9]{2,}$/i,
    /^U[1-9][0-9]{0,}$/i,
    /^T[[1-9][0-9]{0,}$/i
].some(re => re.test(text))

// ==/Utilities==

// ==Modules==

const mod = {
    _: [],

    data: {},

    path_alias: [
        [ "",        ".*\\.luogu\\.(com\\.cn|org)" ],
        [ "bili",    "www.bilibili.com" ],
        [ "cdn",     "cdn.luogu.com.cn" ],
        [ "tcs1",    "service-ig5px5gh-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs2",    "service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com" ],
        [ "tcs3",    "service-otgstbe5-1305163805.sh.apigw.tencentcs.com" ],
        [ "debug",   "localhost:1634" ],
        [ "ghpage",  "extend-luogu.github.io" ],
    ].map(([ alias, path ]) => [ new RegExp(`^@${alias}/`), path ]),

    path_dash_board: [
        "@tcs3/release/exlg-setting", "@debug/exlg-setting/((index|bundle).html)?", "@ghpage/exlg-setting/((index|bundle)(.html)?)?"
    ],

    reg: (name, info, path, data, func, styl) => {
        if (! Array.isArray(path)) path = [ path ]
        path.forEach((p, i) => {
            mod.path_alias.some(([ re, url ]) => {
                if (p.match(re))
                    return path[i] = p.replace(re, url + "/"), true
            })

            if (! p.endsWith("$")) path[i] += "$"
        })

        mod.data[name] = {
            ty: "object",
            lvs: {
                ...data,
                on: { ty: "boolean", dft: true }
            }
        }

        mod._.push({
            name, info, path, func, styl
        })
    },

    reg_main: (name, info, path, data, func, styl) =>
        mod.reg("@" + name, info, path, data, arg => (func(arg), false), styl),

    reg_user_tab: (name, info, tab, vars, data, func, styl) =>
        mod.reg(
            name, info, "@/user/.*", data,
            arg => {
                const $tabs = $(".items")
                const work = () => {
                    if ((location.hash || "#main") !== "#" + tab) return
                    log(`Working user tab#${tab} mod: "${name}"`)
                    func({ ...arg, vars })
                }
                $tabs.on("click", work)
                work()
            }, styl
        ),

    reg_chore: (name, info, period, path, data, func, styl) => {
        if (typeof period === "string") {
            const num = + period.slice(0, -1), unit = {
                s: 1000,
                m: 1000 * 60,
                h: 1000 * 60 * 60,
                D: 1000 * 60 * 60 * 24
            }[ period.slice(-1) ]
            if (! isNaN(num) && unit) period = num * unit
            else error(`Parsing period failed: "${period}"`)
        }

        name = "^" + name
        data = {
            ...data,
            last_chore: { ty: "number", priv: true }
        }

        mod.reg(
            name, info, path, data,
            arg => {
                const last = sto[name].last_chore, now = Date.now()

                let nostyl = true
                if (arg.named || ! last || now - last > period) {
                    if (nostyl) {
                        GM_addStyle(styl)
                        nostyl = false
                    }
                    func(arg)
                    sto[name].last_chore = Date.now()
                }
                else log(`Pending chore: "${name}"`)
            }
        )
    },

    reg_board: (name, info, data, func, styl) => mod.reg(
        name, info, "@/", data,
        arg => {
            const icon_b = `<center><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="mord text sizing reset-size6 size11"><span class="mord texttt">EXLG</span></span></span></span></span></center>`
            let $board = $("#exlg-board")
            if (! $board.length) $board = $(`
                <div class="lg-article" id="exlg-board" exlg="exlg"></div>
            `)
                .prependTo(".lg-right.am-u-md-4")
            func({ ...arg, $board: $(`<div></div>`).appendTo($board) })
        }, styl
    ),

    reg_hook: (name, info, path, data, func, hook, styl) => mod.reg(
        name, info, path, data,
        arg => {
            func(arg)
            $("body").bind("DOMNodeInserted", e => hook(e) && func(arg))
        }, styl
    ),

    reg_hook_new: (name, info, path, data, func, hook, darg, styl) => mod.reg(
        name, info, path, data,
        arg => {
            func({...arg, ...{ result: false, args: darg() }})
            $("body").bind("DOMNodeInserted", (e) => {
                const res = hook(e)
                return res.result && func({...arg, ...res})
            })
        }, styl
    ),

    find: name => mod._.find(m => m.name === name),
    find_i: name => mod._.findIndex(m => m.name === name),

    disable: name => { mod.find(name).on = false },
    enable: name => { mod.find(name).on = true },

    execute: name => {
        const exe = (m, named) => {
            if (! m) error(`Executing named mod but not found: "${name}"`)
            if (m.styl) GM_addStyle(m.styl)
            log(`Executing ${ named ? "named " : "" }mod: "${m.name}"`)
            return m.func({ msto: sto[m.name], named })
        }
        if (name) {
            const m = mod.find(name)
            return exe(m, true)
        }

        const pn = location.href
        for (const m of mod._) {
            m.on = sto[m.name].on
            if (m.on && m.path.some(re => new RegExp(re, "g").test(pn))) {
                if (exe(m) === false) break
            }
        }
    }
}

mod.reg_main("springboard", "跨域跳板", [ "@bili/robots.txt?.*", "@/robots.txt?.*" ], null, () => {
    const q = new URLSearchParams(location.search)
    switch (q.get("type")) {
    // Note: ->
    case "update":
        document.write(`<iframe src="https://service-nd5kxeo3-1305163805.sh.apigw.tencentcs.com/release/exlg-nextgen" exlg="exlg"></iframe>`)
        uindow.addEventListener("message", e => {
            e.data.unshift("update")
            uindow.parent.postMessage(e.data, "*")
        })
        break
    case "page":
        const url = q.get("url")
        if (! q.get("confirm") || confirm(`是否加载来自 ${url} 的页面？`))
            document.body.innerHTML = `<iframe src="${url}" exlg="exlg"></iframe>`
        break
    // Note: <-
    case "dash":
        break
    }
}, `
    iframe {
        border: none;
        display: block;
        width: 100%;
        height: 100%;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`)

mod.reg_main("version-data", "版本数据", "@tcs2/release/exlg-nextgen", null, () =>
    uindow.parent.postMessage([ document.body.innerText ], "*")
)

mod.reg_main("dash-board", "控制面板", mod.path_dash_board, {
    msg: {
        ty: "object",
        priv: true,
        lvs: {
            queue: {
                ty: "array", itm: {
                    ty: "object", lvs: {
                        text: { ty: "string" },
                        id: { ty: "number" }
                    }
                }
            },
            last_id: { ty: "number", dft: 0 }
        }
    },
    lang: {
        ty: "enum", dft: "en", vals: [ "en", "zh" ],
        info: [ "Language of descriptions in the dashboard", "控制面板提示语言" ]
    }
}, () => {
    const novogui_modules = [
        {
            name: "modules",
            displayName: "Modules",
            children: mod._.map(m => ({
                rawName: m.name,
                name: m.name.replace(/^[@^]/g, ""),
                description: m.info,
                settings: Object.entries(mod.data[m.name].lvs)
                    .filter(([ k, s ]) => k !== "on" && ! s.priv)
                    .map(([ k, s ]) => ({
                        name: k,
                        displayName: k.split("_").map(t => t.toInitialCase()).join(" "),
                        description: s.info,
                        type: { number: "SILDER", boolean: "CHECKBOX", string: "TEXTBOX", enum: "" }[s.ty],
                        ...(s.ty === "boolean" && { type: "CHECKBOX" }),
                        ...(s.ty === "number"  && { type: "SLIDER", minValue: s.min, maxValue: s.max, increment: Math.ceil((s.max - s.min) / 50) }),
                        ...(s.ty === "enum"    && { type: "SELECTBOX", acceptableValues: s.vals })
                    }))
            }))
        }
    ]
    uindow.novogui.init(novogui_modules)
})

mod.reg_hook_new("dash-bridge", "控制桥", "@/.*", {
    source: {
        ty: "enum", vals: [ "tcs", "debug", "gh_index", "gh_bundle" ], dft: "tcs",
        info: [ "The website to open when clicking the exlg button", "点击 exlg 按钮时打开的网页" ]
    }
}, ({ msto, args }) => {
    const source = msto.source
    $(`<div id="exlg-dash" exlg="exlg"><svg data-v-78704ac9="" data-v-303bbf52="" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="user-cog" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="svg-inline--fa fa-cog fa-w-20"><path data-v-78704ac9="" data-v-303bbf52="" fill="currentColor" d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" class=""></path></svg> 设置</div>|
     </>`)
        .prependTo(args)
        .on("click", () => uindow.exlg.dash = uindow.open({
            tcs: "https://service-otgstbe5-1305163805.sh.apigw.tencentcs.com/release/exlg-setting",
            debug: "localhost:1634/dashboard",
            gh_index: "https://extend-luogu.github.io/exlg-setting/index.html",
            gh_bundle: "https://extend-luogu.github.io/exlg-setting/bundle.html",
        }[source]))
}, (e) => {
    const $tmp = $(e.target).find(".user-nav > nav > span > div > div > footer")
    if ($tmp.length) return { result: ($tmp.length), args: ($tmp[0].tagName === "DIV" ? $($tmp[0].firstChild) : $tmp) } // Note: 直接用三目运算符不用 if 会触发 undefined 的 tagName 不知道为什么
    else return { result: 0 }
}, () => $("nav.user-nav > span > div > div > footer, div.user-nav > nav > span > div > div > footer"), `
    /* dash */
    #exlg-dash {
        margin-right: 5px;
        position: relative;
        display: inline-block;
        padding: 1px 1px 3px;
        color: #6c757d;
        border-radius: 6px;
        cursor: pointer;
    }
    #exlg-dash > .exlg-warn {
        position: absolute;
        top: -.5em;
        right: -.5em;
    }
    /* global */
    .exlg-icon::before {
        display: inline-block;
        width: 1.3em;
        height: 1.3em;
        margin-left: 3px;
        text-align: center;
        border-radius: 50%;
    }
    .exlg-icon:hover::after {
        display: inline-block;
    }
    .exlg-icon::after {
        display: none;
        content: attr(name);
        margin-left: 5px;
        padding: 0 3px;
        background-color: white;
        box-shadow: 0 0 7px deepskyblue;
        border-radius: 7px;
    }
    .exlg-icon.exlg-info::before {
        content: "i";
        color: white;
        background-color: deepskyblue;
        font-style: italic;
    }
    .exlg-icon.exlg-warn::before {
        content: "!";
        color: white;
        background-color: rgb(231, 76, 60);
        font-style: normal;
    }

    .exlg-unselectable {
        -webkit-user-select: none;
        -moz-user-select: none;
        -o-user-select: none;
        user-select: none;
    }

    :root {
        --exlg-azure:           #7bb8eb;
        --exlg-aqua:            #03a2e8;
        --exlg-indigo:          #3f48cb;
        --std-mediumturquoise:  #48d1cc;
        --std-cornflowerblue:   #6495ed;
        --std-dodgerblue:       #1e90ff;
        --std-white:            #fff;
        --std-black:            #000;
        --lg-gray:              #bbb;
        --lg-gray-2:            #7f7f7f;
        --lg-gray-3:            #6c757d;
        --lg-gray-4:            #414345;
        --lg-gray-5:            #333;
        --lg-gray-6:            #000000bf;
        --lg-blue:              #3498db;
        --lg-blue-button:       #0e90d2;
        --lg-blue-dark:         #34495e;
        --lg-blue-2:            #7cb5ecbf;
        --lg-green:             #5eb95e;
        --lg-green-dark:        #054310c9;
        --lg-green-light:       #5eb95e26;
        --lg-green-light-2:     #c9e7c9;
        --lg-yellow:            #f1c40f;
        --lg-orange:            #e67e22;
        --lg-red:               #e74c3c;
        --lg-red-light:         #dd514c26;
        --lg-red-light-2:       #f5cecd;
        --lg-red-button:        #dd514c;
        --lg-purple:            #8e44ad;
        --argon-indigo:         #5e72e4;
        --argon-red:            #f80031;
        --argon-red-button:     #f5365c;
        --argon-green:          #1aae6f;
        --argon-green-button:   #2dce89;
        --argon-cyan:           #03acca;
        --argon-yellow:         #ff9d09;

        --lg-red-problem:       #fe4c61;
        --lg-orange-problem:    #f39c11;
        --lg-yellow-problem:    #ffc116;
        --lg-green-problem:     #52c41a;
        --lg-blue-problem:      #3498db;
        --lg-purple-problem:    #9d3dcf;
        --lg-black-problem:     #0e1d69;
        --lg-gray-problem:      #bfbfbf;
    }

    .exlg-difficulty-color { font-weight: bold; }
    .exlg-difficulty-color.color-0 { color: rgb(191, 191, 191)!important; }
    .exlg-difficulty-color.color-1 { color: rgb(254, 76, 97)!important; }
    .exlg-difficulty-color.color-2 { color: rgb(243, 156, 17)!important; }
    .exlg-difficulty-color.color-3 { color: rgb(255, 193, 22)!important; }
    .exlg-difficulty-color.color-4 { color: rgb(82, 196, 26)!important; }
    .exlg-difficulty-color.color-5 { color: rgb(52, 152, 219)!important; }
    .exlg-difficulty-color.color-6 { color: rgb(157, 61, 207)!important; }
    .exlg-difficulty-color.color-7 { color: rgb(14, 29, 105)!important; }

    button { margin-bottom: 3px !important; }

    .user-brown { color: #996600 !important; }
    .user-gray { color: #bbb !important; }
    .user-blue { color: #0e90d2 !important; }
    .user-green { color: #5eb95e !important; }
    .user-orange { color: #e67e22 !important; }
    .user-red { color: #e74c3c !important; }
    .user-purple { color: #8e44ad !important; }

    .score-0 { color: rgb(231, 76, 60); }
    .score-1 { color: rgb(243, 156, 17); }
    .score-2 { color: rgb(250, 219, 20); }
    .score-3 { color: rgb(82, 196, 26); }
`)

mod.reg_chore("update", "检查更新", "1D", mod.path_dash_board, null, () => {
    springboard({ type: "update" }).appendTo($("body")).hide()
    uindow.addEventListener("message", e => {
        if (e.data[0] !== "update") return
        e.data.shift()

        const
            latest = e.data[0],
            version = GM_info.script.version,
            op = version_cmp(version, latest)

        const l = `Comparing version: ${version} ${op} ${latest}`
        log(l)

        uindow.novogui.msg(l)
    })
})

// TODO
mod.reg("update-log", "更新日志显示", "@/.*", {
    last_version: { ty: "string", priv: true },
}, ({ msto }) => {
    if (location.href.includes("blog")) return // Note: 如果是博客就退出
    const version = GM_info.script.version
    const fix_html = (str) => {
        let res = `<div class="exlg-update-log-text" style="font-family: ${sto["code-block-ex"].copy_code_font};">`
        str.split("\n").forEach(e => {
            res += `<div>${e.replaceAll(" ", "&nbsp;")}</div><br>`
        })
        return res + "</div>"
    }
    switch (version_cmp(msto.last_version, version)) {
    case "==":
        break
    case "<<":
        lg_alert(fix_html(update_log), `extend-luogu ver. ${version} 更新日志`)
    case ">>":
        msto.last_version = version
    }
}, `
.exlg-update-log-text {
    overflow-x: scroll;
    white-space: nowrap;
}
.exlg-update-log-text > div {
    float: left;
}
`)

mod.reg("emoticon", "表情输入", [ "@/paste", "@/discuss/.*" ], {
    show: { ty: "boolean", dft: true }
}, ({ msto }) => {
    const emo = [
        { type: "emo", name: [ "kk" ], slug: "0" },
        { type: "emo", name: [ "jk" ], slug: "1" },
        { type: "emo", name: [ "se" ], slug: "2" },
        { type: "emo", name: [ "qq" ], slug: "3" },
        { type: "emo", name: [ "xyx" ], slug: "4" },
        { type: "emo", name: [ "xia" ], slug: "5" },
        { type: "emo", name: [ "cy" ], slug: "6" },
        { type: "emo", name: [ "ll" ], slug: "7" },
        { type: "emo", name: [ "xk" ], slug: "8" },
        { type: "emo", name: [ "qiao" ], slug: "9" },
        { type: "emo", name: [ "qiang" ], slug: "a" },
        { type: "emo", name: [ "ruo" ], slug: "b" },
        { type: "emo", name: [ "mg" ], slug: "c" },
        { type: "emo", name: [ "dx" ], slug: "d" },
        { type: "emo", name: [ "youl" ], slug: "e" },
        { type: "emo", name: [ "baojin" ], slug: "f" },
        { type: "emo", name: [ "shq" ], slug: "g" },
        { type: "emo", name: [ "lb" ], slug: "h" },
        { type: "emo", name: [ "lh" ], slug: "i" },
        { type: "emo", name: [ "qd" ], slug: "j" },
        { type: "emo", name: [ "fad" ], slug: "k" },
        { type: "emo", name: [ "dao" ], slug: "l" },
        { type: "emo", name: [ "cd" ], slug: "m" },
        { type: "emo", name: [ "kun" ], slug: "n" },
        { type: "emo", name: [ "px" ], slug: "o" },
        { type: "emo", name: [ "ts" ], slug: "p" },
        { type: "emo", name: [ "kl" ], slug: "q" },
        { type: "emo", name: [ "yiw" ], slug: "r" },
        { type: "emo", name: [ "dk" ], slug: "s" },
        { type: "txt", name: [ "hqlm" ], slug: "l0", name_display: "火前留名" },
        { type: "txt", name: [ "sqlm" ], slug: "l1", name_display: "山前留名" },
        { type: "txt", name: [ "xbt" ], slug: "g1", name_display: "屑标题" },
        { type: "txt", name: [ "iee", "wee" ], slug: "g2", name_display: "我谔谔" },
        { type: "txt", name: [ "kg" ], slug: "g3", name_display: "烤咕" },
        { type: "txt", name: [ "gl" ], slug: "g4", name_display: "盖楼" },
        { type: "txt", name: [ "qwq" ], slug: "g5", name_display: "QωQ" },
        { type: "txt", name: [ "wyy" ], slug: "g6", name_display: "无意义" },
        { type: "txt", name: [ "wgzs" ], slug: "g7", name_display: "违规紫衫" },
        { type: "txt", name: [ "tt" ], slug: "g8", name_display: "贴贴" },
        { type: "txt", name: [ "jbl" ], slug: "g9", name_display: "举报了" },
        { type: "txt", name: [ "%%%", "mmm" ], slug: "ga", name_display: "%%%" },
        { type: "txt", name: [ "ngrb" ], slug: "gb", name_display: "你谷日爆" },
        { type: "txt", name: [ "qpzc", "qp", "zc" ], slug: "gc", name_display: "前排资瓷" },
        { type: "txt", name: [ "cmzz" ], slug: "gd", name_display: "臭名昭著" },
        { type: "txt", name: [ "zyx" ], slug: "ge", name_display: "致远星" },
        { type: "txt", name: [ "zh" ], slug: "gf", name_display: "祝好" },
        { type: "txt", name: [ "sto" ], slug: "gg", name_display: "sto" },
        { type: "txt", name: [ "orz" ], slug: "gh", name_display: "orz" },
    ]

    const emo_url = name => `//图.tk/${name}`
    const $menu = $(".mp-editor-menu"),
        $txt = $(".CodeMirror-wrap textarea")

    if (! $menu.length) return

    $("<br />").appendTo($menu)
    $(".mp-editor-ground").addClass("exlg-ext")

    const $ground = $(".mp-editor-ground"), $show_hide = $menu.children().first().clone(true).addClass("exlg-unselectable")
    $menu.children().last().before($show_hide)
    $show_hide.children()[0].innerHTML = (msto.show) ? "隐藏" : "显示"
    if (msto.show) $menu.addClass("exlg-show-emo"), $ground.addClass("exlg-show-emo")
    $show_hide.on("click", () => {
        $show_hide.children()[0].innerHTML = ["显示", "隐藏"][["隐藏", "显示"].indexOf($show_hide.children()[0].innerHTML)]
        $menu.toggleClass("exlg-show-emo")
        $ground.toggleClass("exlg-show-emo")
        msto.show = ! msto.show
    })

    emo.forEach(m => {
        $((m.type === "emo")?
            `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m.slug)}" /></button>`
            :
            `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
        ).on("click", () => $txt
            .trigger("focus")
            .val(`![](${emo_url(m.slug)})`)
            .trigger("input")
        ).appendTo($menu)
    })
    $menu.append("<div style='height: .35em'></div>")

    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/[0-9a-z]\//g, (_, emo_txt) =>
                `![](` + emo_url(emo.find(m => m.includes(emo_txt))) + `)`
            )
    })
}, `
    .mp-editor-ground.exlg-ext.exlg-show-emo {
        top: 6em !important;
    }
    .mp-editor-menu > br ~ li {
        position: relative;
        display: inline-block;
        margin: 0;
        padding: 5px 1px;
    }
    .mp-editor-menu.exlg-show-emo {
        height: 6em !important;
        overflow: auto;
    }
    .exlg-emo-btn {
        position: relative;
        top: 0px;
        border: none;
        background-color: #eee;
        border-radius: .7em;
        margin: .1em;
        transition: all .4s;
        height: 2em;
    }
    .exlg-emo-btn:hover {
        background-color: #f3f3f3;
        top: -3px;
    }
`)

mod.reg_user_tab("user-intro-ins", "主页指令", "main", null, null, () => {
    $(".introduction > *").each((_, e, $e = $(e)) => {
        const t = $e.text()
        let [ , , ins, arg ] = t.match(/^(exlg.|%)([a-z]+):([^]+)$/) ?? []
        if (! ins) return

        arg = arg.split(/(?<!!)%/g).map(s => s.replace(/!%/g, "%"))
        const $blog = $($(".user-action").children()[0])
        switch (ins) {
        case "html":
            $e.replaceWith($(`<p exlg="exlg">${ xss.process(arg[0]) }</p>`))
            break
        case "frame":
            $e.replaceWith(springboard(
                { type: "page", url: encodeURI(arg[0]), confirm: true },
                `width: ${ arg[1] }; height: ${ arg[2] };`
            ))
            break
        case "blog":
            if ($blog.text().trim() !== "个人博客") return
            $blog.attr("href", arg)
            $e.remove()
            break
        }
    })
}, `
    iframe {
        border: none;
        display: block;
    }
    iframe::-webkit-scrollbar {
        display: none;
    }
`)

let last_ptr = -1, last_board = "submittedProblems"
mod.reg_hook_new("user-problem-color", "题目颜色数量和比较", "@/user/.*", {
    problem_compare: { ty: "boolean", strict: true, dft: true, info: ["AC compare", "AC题目比较"] }
}, ({ msto, args }) => {
    const color = [
        [ 191, 191, 191 ],
        [ 254, 76, 97 ],
        [ 243, 156, 17 ],
        [ 255, 193, 22 ],
        [ 82, 196, 26 ],
        [ 52, 152, 219 ],
        [ 157, 61, 207 ],
        [ 14, 29, 105 ]
    ]
    const _color = id => `rgb(${color[id][0]}, ${color[id][1]}, ${color[id][2]})`
    args.forEach(arg => {
        if (arg.target.href === "javascript:void 0") return  // Hack: 这行绝对不能删！！！不知道为什么钩子那里会放 Js void0 过 check 删了就等着当场原地爆炸吧
        // console.log("arg: ",arg.target, arg)
        // if (! uindow._feInjection.currentData[arg.board_id][arg.position])
        arg.target.style.color = _color([uindow._feInjection.currentData[arg.board_id][arg.position].difficulty])
        if (arg.board_id === "passedProblems" && arg.position === uindow._feInjection.currentData["passedProblems"].length - 1) { // Note: 染色染到最后一个
            $(".exlg-counter").remove()
            const gf = arg.target.parentNode.parentNode.parentNode.parentNode
            const $prb = [$(gf.firstChild.childNodes[2]), $(gf.lastChild.childNodes[2])]

            for (let i = 0; i < 2; ++ i) {
                const $ps = $prb[i]
                const my = uindow._feInjection.currentData[ [ "submittedProblems", "passedProblems" ][i] ]
                $ps.before($(`<span id="exlg-problem-count-${i}" class="exlg-counter" exlg="exlg">${ my.length }</span>`))
            }

            if ((! msto.problem_compare) || uindow._feInjection.currentData.user.uid === uindow._feInjection.currentUser.uid) return
            const func = async () => {
                const content = await lg_content(`/user/${ uindow._feInjection.currentUser.uid }`)
                const my = content.currentData.passedProblems
                const ta = uindow._feInjection.currentData.passedProblems
                let same = 0
                const $ps = $prb[1]
                $ps.find("a").each((d, p, $p = $(p)) => {
                    if (my.some(m => m.pid === ta[d].pid)) {
                        same ++
                        $p.css("backgroundColor", "rgba(82, 196, 26, 0.3)")
                    }
                })
                $("#exlg-problem-count-1").html(`<span class="exlg-counter" exlg="exlg">${ ta.length } <> ${ my.length } : ${same}`
                    + `<i class="exlg-icon exlg-info" name="ta 的 &lt;&gt; 我的 : 相同"></i></span>`)
            }
            func()
        }
    })
}, (e) => {
    if (! /.*\/user\/.*#practice/.test(location.href)) return { result: false, args: { message: "Not at practice page." } }
    if (e.target.tagName.toLowerCase() !== "a" || e.target.className !== "color-default" || e.target.href.indexOf("/problem/") === -1)
        return { result: false, args: { message: "It's not a problem element" } }
    const tar = e.target, _pid = tar.href.slice(33), ucd = uindow._feInjection.currentData,
        _onchange = [ucd.submittedProblems[0].pid, ucd.passedProblems[0].pid].includes(_pid)
    return {
        result: true,
        args: [{
            onchange: _onchange,
            board_id: ["submittedProblems", "passedProblems"][(_onchange ? (last_board = [ucd.submittedProblems[0].pid, ucd.passedProblems[0].pid].indexOf(_pid)) : (last_board))],
            position: (_onchange ? (last_ptr = 0) : (++ last_ptr)),
            target: tar
        }]
    }
}, () => [],`
    .main > .card > h3 {
        display: inline-block;
    }
`)

mod.reg("benben", "全网犇犇", "@/", {
    source: {
        ty: "enum", dft: "o2", vals: [ "o2", "shy" ],
        info: [ "Switch the way of fetching benben", "切换全网犇犇获取方式" ]
    }
}, ({msto}) => {
    const color = {
        Gray: "gray",
        Blue: "bluelight",
        Green: "green",
        Orange: "orange lg-bold",
        Red: "red lg-bold",
        Purple: "purple lg-bold",
        Brown: "brown lg-bold",
    }
    const check_svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%" style="margin-bottom: -3px;" exlg="exlg">
            <path d="M16 8C16 6.84375 15.25 5.84375 14.1875 5.4375C14.6562 4.4375 14.4688 3.1875 13.6562 2.34375C12.8125 1.53125 11.5625 1.34375 10.5625 1.8125C10.1562 0.75 9.15625 0 8 0C6.8125 0 5.8125 0.75 5.40625 1.8125C4.40625 1.34375 3.15625 1.53125 2.34375 2.34375C1.5 3.1875 1.3125 4.4375 1.78125 5.4375C0.71875 5.84375 0 6.84375 0 8C0 9.1875 0.71875 10.1875 1.78125 10.5938C1.3125 11.5938 1.5 12.8438 2.34375 13.6562C3.15625 14.5 4.40625 14.6875 5.40625 14.2188C5.8125 15.2812 6.8125 16 8 16C9.15625 16 10.1562 15.2812 10.5625 14.2188C11.5938 14.6875 12.8125 14.5 13.6562 13.6562C14.4688 12.8438 14.6562 11.5938 14.1875 10.5938C15.25 10.1875 16 9.1875 16 8ZM11.4688 6.625L7.375 10.6875C7.21875 10.8438 7 10.8125 6.875 10.6875L4.5 8.3125C4.375 8.1875 4.375 7.96875 4.5 7.8125L5.3125 7C5.46875 6.875 5.6875 6.875 5.8125 7.03125L7.125 8.34375L10.1562 5.34375C10.3125 5.1875 10.5312 5.1875 10.6562 5.34375L11.4688 6.15625C11.5938 6.28125 11.5938 6.5 11.4688 6.625Z"></path>
        </svg>
    `
    const check = lv => lv <= 3 ? "" : check_svg.replace("%", lv <= 5 ? "#5eb95e" : lv <= 8 ? "#3498db" : "#f1c40f")

    const oriloadfeed = unsafeWindow.loadFeed

    unsafeWindow.loadFeed = function () {
        if (unsafeWindow.feedMode==="all-exlg") {
            GM_xmlhttpRequest({
                method: "GET",
                url: (msto.source === "o2") ? (`https://service-ig5px5gh-1305163805.sh.apigw.tencentcs.com/release/APIGWHtmlDemo-1615602121`) : (`https://bens.rotriw.com/api/list/proxy?page=${unsafeWindow.feedPage}`),
                onload: (res) => {
                    const e = JSON.parse(res.response)
                    e.forEach(m => $(`
                <li class="am-comment am-comment-primary feed-li" exlg="exlg">
                    <div class="lg-left">
                        <a href="/user/${ m.user.uid }" class="center">
                            <img src="https://cdn.luogu.com.cn/upload/usericon/${ m.user.uid }.png" class="am-comment-avatar">
                        </a>
                    </div>
                    <div class="am-comment-main">
                        <header class="am-comment-hd">
                            <div class="am-comment-meta">
                                <span class="feed-username">
                                    <a class="lg-fg-${ color[m.user.color] }" href="/user/${ m.user.uid }" target="_blank">
                                        ${ m.user.name }
                                    </a>
                                    <a class="sb_amazeui" target="_blank" href="/discuss/show/142324">
                                        ${ check(m.user.ccfLevel) }
                                    </a>
                                    ${ m.user.badge ? `<span class="am-badge am-radius lg-bg-${ color[m.user.color] }">${ m.user.badge }</span>` : "" }
                                </span>
                                ${ new Date(m.time * 1000).format("yyyy-mm-dd HH:MM") }
                                <a name="feed-reply">回复</a>
                            </div>
                        </header>
                        <div class="am-comment-bd">
                            <span class="feed-comment">
                                ${ marked(m.content) }
                            </span>
                        </div>
                    </div>
                </li>
            `)
                        .appendTo($("ul#feed"))
                        .find("a[name=feed-reply]").on("click", () => {
                            scrollToId("feed-content")
                            setTimeout(
                                () => $("textarea")
                                    .trigger("focus").val(` || @${ m.user.name } : ${ m.content }`)
                                    .trigger("input"),
                                50
                            )
                        })
                    )
                },
                onerror: error
            })
            // unsafeWindow.feedPage++
            // $("#feed-more").children("a").text("点击查看更多...")
        }
        else{
            oriloadfeed()
        }
    }

    const $sel = $(".feed-selector")
    $(`<li class="feed-selector" id="exlg-benben-selector" data-mode="all-exlg" exlg="exlg"><a style="cursor: pointer">全网动态</a></li>`)
        .appendTo($sel.parent())
        .on("click", e => {
            const $this = $(e.currentTarget)
            $sel.removeClass("am-active")
            $this.addClass("am-active")
            if (msto.source === "o2") {
                $("#feed-more").hide()
            }
            unsafeWindow.feedPage=1
            unsafeWindow.feedMode="all-exlg"
            $("li.am-comment").remove()

            unsafeWindow.loadFeed()
        })
})

mod.reg("poem-task", "古诗词和每日任务", "@/", {
    total: { ty: "number" },
    tasklist: {
        ty: "tuple",
        lvs: [
            { ty: "string", dft: false, strict: true, repeat: 50 }
        ],
        priv: true
    }
}, ({msto}) => {
    let $board = $(`
        <div class="am-u-md-12 ">
            <div class="lg-article">
                <div class="am-g">
                <div class="am-u-md-4 lg-punch am-text-center" id="gushici" style="top: 50%;margin-top: -40px;position: absolute;">
                        <strong></strong>
                    </div>
                    <div class="am-u-md-8">
                        <h2>你的任务</h2>
                        <div class="lg-article exlg-index-stat exlg-editor" id="task-list">
                        </div>
                        <input type="text" class="am-form-field" placeholder="输入你的任务(不支持 Markdown)" id="exlg-task">
                        <p>
                            <button class="am-btn am-btn-danger am-btn-sm" id="add-task">添加</button>
                            <button class="am-btn am-btn-group am-btn-sm" id="empty-task">一键清空</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `);
    $board.prependTo(".lg-index-content");
    $board.next().insertBefore($board);
    GM_xmlhttpRequest({
        method: "GET",
        url: `https://v1.jinrishici.com/rensheng`,
        onload: function (res) {
            res = JSON.parse(res.responseText);
            $(`<div style="font-size: 2.0rem">${res.content}</div>`).appendTo("#gushici > strong");
            $(`<div style="font-size: 1.8rem">《${res.origin}》—${res.author}</div>`).appendTo("#gushici");
        },
        onerror: function () {
            $(`<div style="font-size: 2.0rem">不经一番寒彻骨，怎得梅花扑鼻香。</div>`).appendTo("#gushici > strong");
            $(`<div style="font-size: 1.8rem">《上堂开示颂》—黄蘖禅师</div>`).appendTo("#gushici");
        }
    });
    if (msto.total == null) msto.total = 0;
    const writetask = () => {
        $("#task-list").empty();
        for (let i = 0; i < msto.total; i++)
        {
            $(`<div> ${msto.tasklist[i]}</div>`).appendTo("#task-list")
            let $bt = $(`<i class="am-icon-minus remove-task" data="${i}"></i>`);
            $bt.prependTo(`#task-list > div:eq(${i})`);
            $bt.click(() => {
                var data = parseInt($bt.attr("data"));
                for (var j = data; j < msto.total; j++) {
                    if(msto.tasklist[j + 1] != false)
                        msto.tasklist[j] = msto.tasklist[j + 1];
                }
                msto.total --;
                writetask();
            })
        }
    }
    writetask();
    const add = () => {
        if (msto.total >= 50) { lg_alert("不要超过五十个哦！"); return; }
        msto.tasklist[msto.total++] = $("#exlg-task").val();
        writetask();
    }
    $("#add-task").click(add);
    $("#empty-task").click(() => {
        msto.total = 0;
        writetask();
    });
    $("#exlg-task").keydown(e => { e.key === "Enter" && add() })
}, `
    @import url('https://fonts.googleapis.com/css?family=Long+Cang');
    #gushici {
        font-family: 'Long Cang',cursive;
    }
`)

mod.reg("rand-footprint", "随机足迹", "@/", {
    total: { ty: "number" },
    checked: { ty: "boolean" },
    Usersname: {
        ty: "tuple",
        lvs: [
            { ty: "string", dft: false, strict: true, repeat: 50 }
        ],
        priv: true
    },
    Usn: {
        ty: "tuple",
        lvs: [
            { ty: "string", dft: false, strict: true, repeat: 50 }
        ],
        priv: true
    }
}, ({msto}) => {
    let $board = $("<div class='am-u-md-3' name='exlg-rand-board'></div>");
    $board.html(`
        <div class='lg-article exlg-index-stat'>
            <h2>足迹</h2>
            <div class="am-input-group am-input-group-primary am-input-group-sm">
                <input type="text" class="am-form-field" placeholder="随机跳转用户通过的题目" name="username-passed" id="search-user-passed">
            </div>
            <p>
                <button class="am-btn am-btn-danger am-btn-sm" id="add-user">添加</button>
                <button class="am-btn am-btn-primary am-btn-sm" id="remove-user">移除</button>
                <button class="am-btn am-btn-group am-btn-sm" id="empty-user">一键清空</button>
                <button class="am-btn am-btn-success am-btn-sm" id="goto-users-passed">跳转</button>
                <input type="checkbox" ${msto.checked? "checked=true": ""} id="check-ac">
                包括已 AC 题目
            </p>
        </div>
    `);
    $("div.am-u-md-3").after($board);
    let $nameboard = $(`
        <div class="am-u-md-2" id="exlg-rand-nameboard">
            <div class="lg-article exlg-index-stat exlg-editor">
            </div>
        </div>
    `);
    $board.after($nameboard);
    if (msto.total == null) msto.total = 0;
    const writename = () => {
        $("#exlg-rand-nameboard > div").empty();
        for (let i = 0; i < msto.total; i++)
        {
            $(`<div>@<a href="/user/${msto.Usersname[i]}">${msto.Usn[i]}</a></div>`).appendTo("#exlg-rand-nameboard > div");
        }
    }
    writename();
    function isIndexOf (arr1, id) {
        for (let i = 0; i < msto.total; i++)
            if(arr1[i] === id) return true;
        return false;
    }
    const add = () => {
        $adduser.prop("disabled", true)
        if (msto.total >= 50)
        {
            $adduser.prop("disabled", false)
            lg_alert("请不要超过 50 人哦")
        }
        $.get("/api/user/search?keyword=" + $("[name=username-passed]").val(), res => {
            if (! res.users[0]) {
                $adduser.prop("disabled", false)
                lg_alert("无法找到指定用户")
            }
            else {
                let usern = res.users[0].uid;
                if (!isIndexOf(msto.Usersname, `${usern}`)) msto.Usersname[msto.total] = `${usern}`, msto.Usn[msto.total++] = res.users[0].name;
                writename();
                $adduser.prop("disabled", false)
            }
        })
    }
    const rem = () => {
        $removeuser.prop("disabled", true)
        $.get("/api/user/search?keyword=" + $("[name=username-passed]").val(), res => {
            if (!res.users[0]) {
                $removeuser.prop("disabled", false)
                lg_alert("无法找到指定用户")
            }
            else {
                let usern = res.users[0].uid;
                for (let i = 0, flag = 0; i < msto.total; i++)
                {
                    if (msto.Usersname[i] === `${usern}`) flag = 1;
                    if (flag)
                    {
                        if(msto.Usn[i + 1] !== false) msto.Usn[i] = msto.Usn[i + 1];
                        if(msto.Usersname[i + 1] !== false) msto.Usersname[i] = msto.Usersname[i + 1];
                    }
                }
                msto.total--;
                writename();
                $removeuser.prop("disabled", false)
            }
        })
    }
    function  isIntersect(arr1, arr2) {
        let newarr = arr1.filter( x => {
			return arr2.some( y => {
				return x.pid == y.pid;
			})
		});
        return newarr.length >= arr2.length;
    }
    function isInclude(arr1, pid)
    {
        var newArr = arr1.filter(function(p){
            return p.pid === pid;
        });
        return newArr.length != 0;
    }
    const rand_jump = async () => {
        $randjump.prop("disabled", true);
        let isAC = msto.checked;
        if (msto.total == 0) { $randjump.prop("disabled", false); lg_alert("您还未选择用户"); return; }
        let useruid = msto.Usersname[Math.floor(Math.random() * msto.total)];
        let myres = await lg_content(`/user/${uindow._feInjection.currentUser.uid}`);
        let Canuser = [];
        for (let i = 0; i < msto.total; i++)
        {
            let res = await lg_content(`/user/${msto.Usersname[i]}`);
            let pbnum = res.currentData.user.passedProblemCount;
            if (pbnum != 0 && typeof res.currentData.passedProblems != "undefined")
            {
                if (isAC || !isIntersect(myres.currentData.passedProblems, res.currentData.passedProblems))Canuser.push(msto.Usersname[i]);
            }
        }
        if (Canuser.length == 0) { $randjump.prop("disabled", false); lg_alert("这些用户都开了完全隐私保护或还未通过题目或只做了您所做过的题目"); return; }
        let res = await lg_content(`/user/${useruid}`);
        let pbnum = res.currentData.user.passedProblemCount;
        while (pbnum == 0 || typeof res.currentData.passedProblems == "undefined" || (!isAC && isIntersect(myres.currentData.passedProblems, res.currentData.passedProblems)))
        {
            useruid = msto.Usersname[Math.floor(Math.random() * msto.total)];
            res = await lg_content(`/user/${useruid}`);
            pbnum = res.currentData.user.passedProblemCount;
        }
        let Pro = res.currentData.passedProblems[Math.floor(Math.random() * pbnum)].pid;
        while (!isAC && isInclude(myres.currentData.passedProblems, Pro)) {Pro = res.currentData.passedProblems[Math.floor(Math.random() * pbnum)].pid;}
        $randjump.prop("disabled", false);
        location.href = `/problem/${Pro}`;
    }

    const $adduser = $("#add-user").on("click", add), $removeuser = $("#remove-user").on("click", rem);
    $("#empty-user").on("click", () => {
        msto.total = 0; writename();
    })
    $("#check-ac").on("click", () => {
        msto.checked = $("#check-ac").get(0).checked;
    })
    const $randjump = $("#goto-users-passed").on("click", rand_jump);
    $("#search-user-passed").keydown(e => { e.key === "Enter" && add() })
}, `
.exlg-index-stat{
    height: 190px;
}
.exlg-editor{
    overflow: auto;
}
`)

const grade = [2147483647, 799, 1199, 1399, 1599, 2099, 2599, 2147483647];
let NewConfig = (a, configs) => {
    new Promise((r) => {
        $.ajax({
            type: "POST",
            url: `https://www.luogu.com.cn/paste/new`,
            beforeSend: function (request) {
                request.setRequestHeader(
                    "x-csrf-token",
                    $("meta[name='csrf-token']")[0].content
                );
            },
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({
                public: false,
                data: a + JSON.stringify(configs),
            }),
            success: () => r(),
        });
    });
}

let EditConfig = (a, configs, pageid) => {
    new Promise((r) => {
        $.ajax({
            type: "POST",
            url: `https://www.luogu.com.cn/paste/edit/${pageid}`,
            beforeSend: function (request) {
                request.setRequestHeader(
                    "x-csrf-token",
                    $("meta[name='csrf-token']")[0].content
                );
            },
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({
                public: false,
                data: a + JSON.stringify(configs),
            }),
            success: () => r(),
        });
    });
}

let viewset, configs;

let date = new Date;
date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
configs = {"constructive_problem": 1200, "dynamic_problem": 1200, "single_problem": 1200, "practice_contest": 1200, "cf_multiple_contest": 1200, "simulation_contest": 0, "date": date};
viewset = {"constructive_problem":null,"dynamic_problem":null,"single_problem":null,"practice_contest":null,"cf_multiple_contest":null,"simulation_contest":null};
const TimeLong = 1000 * 60 * 60 + 1000;

mod.reg("contest-jump", "比赛跳转", "@/contest/\\d.*", null, () => {
    let nowtime = new Date();
    if (uindow.location.href.replace(/[^0-9]/ig,"") == 1 || nowtime < uindow._feInjection.currentData.contest.endTime * 1000) return;
    const addcontest = async function () {
        let u = await lg_content("https://www.luogu.com.cn/paste?_contentOnly");
        let flag = 0, pageid;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 12) !== "#ExChartData") return;
            let k = u.data;
            pageid = u.id;
            configs = JSON.parse(k.substr(12, k.length));
            flag = 1;
            return;
        }   );
        if (flag) {
            var dateStart = new Date(configs.date + " 0:00:00");
            var dateEnd = new Date();
            var difVal = Math.floor(Math.abs(dateEnd - dateStart) / (1000 * 60 * 60 * 24));
            for (var i in configs)
            {
                if (i == "date") continue;
                if (configs[i] >= difVal * 5)
                    configs[i] -= difVal * 5;
                    else configs[i] = 0;
            }
            configs.date = dateEnd.getFullYear() + "-" + (dateEnd.getMonth() + 1) + "-" + dateEnd.getDate();
            EditConfig("#ExChartData", configs, pageid);
        }
        else{
            NewConfig("#ExChartData", configs);
        }
        flag = 0;
        let pageid2;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 11) !== "#ExViewData") return;
            let k = u.data;
            pageid2 = u.id;
            viewset = JSON.parse(k.substr(11, k.length));
            flag = 1;
            return;
        });
        if (!flag) NewConfig("#ExViewData", viewset);

        let Doingflag = 0, Doing, DoingPid;
        for (var i in viewset)
        {
            if (viewset[i] == null) continue;
            let nowDate = new Date(), endDate = new Date(viewset[i].date);
            if (endDate < nowDate)
            {
                if (i === "single_problem" || i === "dynamic_problem" || i === "constructive_problem") {
                    let res = await lg_content(`/problem/${viewset[i].problem[0].pid}`);
                    if (res.currentData.problem.accepted == true) {
                        let finalscore = viewset[i].problem[0].span * 7 + 10 - viewset[i].problem[0].times;
                        configs[i] += finalscore;
                        EditConfig("#ExChartData", configs, pageid);
                    }
                }
                viewset[i] = null;
                EditConfig("#ExViewData", viewset, pageid2);
                break;
            }
            DoingPid = viewset[i].problem[0].pid;
            Doingflag = 1;
            Doing = i;
        }
        if (Doingflag) {
            uindow._feInstance.$swal({
                title: "您已经在写其它题了",
                text: "2 秒后跳转到您正在写的题目",
                type: "warning",
                timer: 2000,
                showConfirmButton: false,
            }).then(() =>{
                if (Doing === "single_problem" || Doing === "dynamic_problem" || Doing === "constructive_problem")
                    uindow.location = `/problem/${DoingPid}`;
                else uindow.location = "/contest/1";
            })
        }
        var date = new Date();
        date = date.getTime() + (uindow._feInjection.currentData.contest.endTime - uindow._feInjection.currentData.contest.startTime) * 1000;
        viewset.practice_contest = {"date": new Date(date).getTime(), "TimeLong": (uindow._feInjection.currentData.contest.endTime - uindow._feInjection.currentData.contest.startTime) / 3600, "problem": []};
        for (let i = 0; i < uindow._feInjection.currentData.contestProblems.length; i++) {
            viewset.practice_contest.problem.push({"pid": uindow._feInjection.currentData.contestProblems[i].problem.pid, "name": uindow._feInjection.currentData.contestProblems[i].problem.title, "index": String.fromCharCode(i + 65), "fullScore": uindow._feInjection.currentData.contestProblems[i].problem.fullScore});
        }
        EditConfig("#ExViewData", viewset, pageid2);
        location.href = `https://www.luogu.com.cn/contest/1`;
    }
    $cp = $(`<button id="start" type="button" class="lfe-form-sz-middle" style="border-color: rgb(221, 81, 76) !important; background-color: rgb(221, 81, 76) !important; display:inline-block; flex:none; outline:0; cursor:pointer; color:#fff; font-weight:inherit; line-height:1.5; text-align:center; vertical-align:middle; background:0 0; border-radius:3px; border:1px solid">开始比赛</button>`);
    $cp.hover(
        function(){ $cp.css("background-color", "rgb(221, 81, 76, 0.9)");},
        function(){ $cp.css("background-color", "rgb(221, 81, 76)");});
    $cp.prependTo(".operation");
    $cp.click(addcontest);
}, ``)

let lstpage = -1;
let flagarr = [];
mod.reg_hook("excontest", "比赛功能", ["@/contest/1.*", "@/record/.*"], null, () => {
    const func = async() => {
        let u = await lg_content("https://www.luogu.com.cn/paste?_contentOnly");
        let flag = 0, pageid1;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 11) !== "#ExViewData") return;
            let k = u.data;
            pageid1 = u.id;
            viewset = JSON.parse(k.substr(11, k.length));
            flag = 1;
            return;
        });
        if (!flag) NewConfig("#ExViewData", viewset);
        flag = 0;
        let pageid2;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 12) !== "#ExChartData") return;
            let k = u.data;
            pageid2 = u.id;
            configs = JSON.parse(k.substr(12, k.length));
            flag = 1;
            return;
        });
        if (flag) {
            var dateStart = new Date(configs.date);
            var dateEnd = new Date();
            var difVal = Math.floor(Math.abs(dateEnd - dateStart) / (1000 * 60 * 60 * 24));
            for (var i in configs)
            {
                if (i == "date") continue;
                if (configs[i] >= difVal * 5)
                    configs[i] -= difVal * 5;
                else configs[i] = 0;
            }
            configs.date = dateEnd.getFullYear() + "-" + (dateEnd.getMonth() + 1) + "-" + dateEnd.getDate();
            EditConfig("#ExChartData", configs, pageid2);
        }
        else NewConfig("#ExChartData", configs);

        flag = 0;
        let Doing;
        for (var i in viewset)
        {
            if (viewset[i] == null) continue;
            let nowDate = new Date(), endDate = new Date(viewset[i].date);
            if (endDate < nowDate)
            { viewset[i] = null; EditConfig("#ExViewData", viewset, pageid1); break; }
            flag = 1;
            Doing = i;
        }

        if (uindow.location.href.match(/record/gi)) {
            if (Doing == "practice_contest" || Doing == "simulation_contest")
            uindow.location.href = "https://www.luogu.com.cn/contest/1";
            return;
        }
        if (uindow.location.href.match(/contest/gi)) {

            if (Doing === "practice_contest" || Doing === "simulation_contest")
                $(".lfe-body:eq(0) > a:eq(3)").remove();

            $(".field:eq(1)").remove();
            $(".side > .card.padding-default:eq(1)").addClass("timerboard");
            if (Doing == "practice_contest") {
                $("title").text(`练习赛 - 洛谷 | 计算机科学教育新生态`);
                $(".header > h1").text("练习赛");
                $(".marked").empty();
                $(".value.lfe-caption").text(`${viewset[Doing].problem.length}`);
                $(`<h2>练习赛</h2><p>题目难度由积分决定</p>`).appendTo($(".marked"));
                $("li:eq(2)").remove();
            } else
                if (Doing == "cf_multiple_contest") {
                    $("title").text(`CF 题 - 洛谷 | 计算机科学教育新生态`);
                    $(".header > h1").text("CF 题");
                    $(".value.lfe-caption").text(`${viewset[Doing].problem.length}`);
                    $(".marked").empty();
                    $(`
                        <h2>CF 题</h2>
                        <p>排行榜会出锅，并不会修......</p>
                        <p><strong>请注意：</strong>CF 题并不是 CF 制，只是同样的题目。<s>因为我不会维护 CF 制</s></p>
                    `).appendTo($(".marked"));
                } else
                    if (Doing == "simulation_contest") {
                        $("title").text(`模拟赛 - 洛谷 | 计算机科学教育新生态`);
                        $(".header > h1").text("模拟赛");
                        $(".marked").empty();
                        $(".value.lfe-caption").text(`${viewset[Doing].problem.length}`);
                        $(`
                            <h2>模拟赛</h2>
                            <p>模拟考试。</p>
                        `).appendTo($(".marked"));
                        $("li:eq(2)").remove();
                    } else {
                        $("title").text(`无比赛 - 洛谷 | 计算机科学教育新生态`);
                        $(".header > h1").text("无比赛");
                        $(".marked").empty();
                        $(`
                            <h2>无比赛</h2>
                            <p>您现在并没有在做比赛。</p>
                        `).appendTo($(".marked"));
                        $(".value.lfe-caption").text("无");
                        $("li:eq(2)").remove();
                        $("li:eq(1)").remove();
                        $("time").text("未来");
                        return;
                    }
            $(`<p>比赛将结束时请回到此页面，否则<strong>无法算分</strong>！</p>`).appendTo($(".marked"));
            var endTime = new Date(viewset[Doing].date),
                startTime = new Date(viewset[Doing].date - (TimeLong - 1000) * viewset[Doing].TimeLong);
            $("time:eq(0)").text(`${startTime.getFullYear()}-${(startTime.getMonth()+1).toString().padStart(2,'0')}-${startTime.getDate().toString().padStart(2,'0')} ${startTime.getHours().toString().padStart(2,'0')}:${startTime.getMinutes().toString().padStart(2,'0')}`);
            $("time:eq(1)").text(`${endTime.getFullYear()}-${(endTime.getMonth()+1).toString().padStart(2,'0')}-${endTime.getDate().toString().padStart(2,'0')} ${endTime.getHours().toString().padStart(2,'0')}:${endTime.getMinutes().toString().padStart(2,'0')}`);
            $(".info-rows > div:eq(5) > span:eq(1) > span").text(`${viewset[Doing].TimeLong.toFixed(2)}h`);
            let nowtime = new Date();
            let endtime = new Date(viewset[Doing].date);
            nowtime = endtime.getTime() - nowtime.getTime();
            let hour = Math.floor(nowtime / (1000*60*60) % 24),
                minute = Math.floor(nowtime / (1000*60) % 60),
                sec = Math.floor(nowtime / 1000 % 60);
            $(".timerboard").html(`
                <h2 data-v-796309f8="" class="lfe-h2" >
                    本比赛倒计时还有 ${hour > 0? hour + " 小时": ""} ${minute > 0? minute + " 分": ""} ${sec > 0? sec + " 秒钟": ""}
                </h2>
                <p data-v-796309f8="">请耐心作答。</p>
            `);
            let Finish = async () => {
                $cp.remove();
                clearInterval(Timer_board);
                $(".timerboard").remove();
                uindow._feInstance.$swalToastSuccess("比赛结束！");
                let finalscore = 0;
                for (let i = 0; i < viewset[Doing].problem.length; i++) {
                    let res = await lg_content(`/problem/${viewset[Doing].problem[i].pid}`);
                    if (res.currentData.problem.type == "P")
                        finalscore += res.currentData.problem.score;
                    else
                        finalscore += viewset[Doing].problem[i].fullScore * res.currentData.problem.accepted;
                }
                configs[Doing] += finalscore - Math.floor(38.75 * viewset[Doing].problem.length);
                EditConfig("#ExChartData", configs, pageid2);
                viewset[Doing] = null;
                EditConfig("#ExViewData", viewset, pageid1);
                uindow.location.reload();
            }
            $(".operation").empty();
            $cp = $(`<button id="finish" type="button" class="lfe-form-sz-middle" style="border-color: rgb(221, 81, 76) !important; background-color: rgb(221, 81, 76) !important; display:inline-block; flex:none; outline:0; cursor:pointer; color:#fff; font-weight:inherit; line-height:1.5; text-align:center; vertical-align:middle; background:0 0; border-radius:3px; border:1px solid">AK 了？提前结束！</button>`);
            $cp.hover(
                function(){ $cp.css("background-color", "rgb(221, 81, 76, 0.9)");},
                function(){ $cp.css("background-color", "rgb(221, 81, 76)");});
            $cp.prependTo(".operation");
            $cp.click(Finish);
            var Timer_board = setInterval (async () => {
                let nowtime = new Date();
                let endtime = new Date(viewset[Doing].date);
                nowtime = endtime.getTime() - nowtime.getTime();
                if (nowtime < 1000)
                {
                    Finish();
                    return;
                }
                let hour = Math.floor(nowtime / (1000*60*60) % 24),
                    minute = Math.floor(nowtime / (1000*60) % 60),
                    sec = Math.floor(nowtime / 1000 % 60);
                $(`.timerboard > h2`).text(`本比赛倒计时还有 ${hour > 0? hour + " 小时": ""} ${minute > 0? minute + " 分": ""} ${sec > 0? sec + " 秒钟": ""}`);
            }, 1000);
            if (uindow.location.href.match(/problems/gi)) {
                $("div.row-wrap").empty();
                for (let i = 0; i < viewset[Doing].problem.length; i++) {
                    $(`
                        <div data-v-7178e78a="" data-v-24f898d2="" class="row">
                            <div data-v-7178e78a="" data-v-24f898d2="" class="part">
                                <span data-v-7178e78a="" data-v-24f898d2="" class="pid">
                                    ${viewset[Doing].problem[i].index}
                                </span>
                                <span data-v-7178e78a="" data-v-24f898d2="" class="score">
                                    ${viewset[Doing].problem[i].fullScore}
                                </span>
                                <div data-v-7178e78a="" data-v-24f898d2="" class="title">
                                    <a data-v-303bbf52="" data-v-7178e78a="" href="/problem/${viewset[Doing].problem[i].pid}" target="_blank" colorscheme="default" class="title color-default" data-v-24f898d2="">
                                        ${viewset[Doing].problem[i].name}
                                    </a>
                                </div>
                            </div>
                        </div>
                    `).appendTo($("div.row-wrap"));
                }
            }
            if (uindow.location.href.match(/scoreboard/gi)) {
                let finalscore = 0;
                $("div.row-wrap > .row > .score").remove();
                for (let i = 0; i < viewset[Doing].problem.length; i++) {
                    if (flagarr[i] == 1) continue;
                    flagarr[i] = 1;
                    let res = await lg_content(`/problem/${viewset[Doing].problem[i].pid}`);
                    let scocol, col = [30, 60, 80, 2147483647], nowsco;
                    if (res.currentData.problem.type == "P")
                        nowsco = res.currentData.problem.score;
                    else
                        nowsco = viewset[Doing].problem[i].fullScore * res.currentData.problem.accepted;
                    for (scocol = 0; col[scocol] <= nowsco; scocol++);
                    $(`
                        <div data-v-0f607a24="" data-v-24f898d2="" class="score">
                            <span data-v-0f607a24="" data-v-24f898d2="" class="score-${scocol}" style="font-weight: bold;">${nowsco}</span>
                        </div>
                    `).appendTo("div.row-wrap > .row");
                    finalscore += nowsco;
                }
                if (flagarr[viewset[Doing].problem.length] != 1) {
                    flagarr[viewset[Doing].problem.length] = 1;
                    $("div.row-wrap > .row > .score:eq(0)").before($(`
                    <div data-v-0f607a24="" data-v-24f898d2="" class="score">
                    <span data-v-0f607a24="" data-v-24f898d2="" style="font-weight: bold;">${finalscore}</span>
                    </div>
                    `))
                }
                $("div.row-wrap > .row > .user").empty();
                $(`
                    <span data-v-6eed723a="" data-v-0f607a24="" class="wrapper" data-v-24f898d2="">
                        <a data-v-303bbf52="" data-v-6eed723a="" href="/user/${uindow._feInjection.currentUser.uid}" target="_blank" colorscheme="none">
                            <span data-v-6eed723a="" data-v-303bbf52="" class="user-${uindow._feInjection.currentUser.color.toLowerCase()}" style="font-weight: bold;">${uindow._feInjection.currentUser.name}</span>
                        </a>
                    </span>
                `).appendTo("div.row-wrap > .row > .user");
                $(".header-wrap > .header > .score").remove();
                $(`
                    <div data-v-0f607a24="" sortparams="[object Object]" class="score" data-v-24f898d2="">
                        <span class="lfe-caption">总分
                        </span>
                    </div>
                `).appendTo(".header-wrap > .header");
                for (let i = 0; i < viewset[Doing].problem.length; i++) {
                    $(`
                        <div data-v-0f607a24="" sortparams="[object Object]" class="score" data-v-24f898d2="">
                            <span class="lfe-caption">
                                <span data-v-0f607a24="" data-original-title="null" class=" has-tooltip" style="width: 100%;">${viewset[Doing].problem[i].index}</span>
                            </span>
                        </div>
                    `).appendTo(".header-wrap > .header");
                }
            }
        }
    }
    func();
}, (e) => {
    let now_page = uindow.location.href.slice(33);
    if (now_page !== lst_page) {
        flagarr.splice(0, flagarr.length);
        lst_page = now_page;
        return { result: true };
    }
}, () => [], ``)

let btflag, btflag2, btflag3, btflag4;
mod.reg_hook("exview", "读题功能", ["@/record/.*", "@/problem/P\\d+(\\#submit+)*$", "@/problem/AT\\d+(\\#submit+)*$", "@/problem/SP\\d+(\\#submit+)*$", "@/problem/CF\\d\\w+(\\#submit+)*$", "@/problem/UVA\\d+(\\#submit+)*$"], null, () => {
    let Translate = async() => {
        $("mi").remove();
        $("annotation").remove();
        $("#translate").remove();
        $transborad = $(`<div data-v-796309f8="" class="card padding-default" id="translate" data-v-6febb0e8="">
            <h3 data-v-2017244a="" data-v-796309f8="" class="lfe-h3">翻译</h3>
            <p>框选内容，点击按钮即可翻译！</p>
            <button data-v-370e72e2="" data-v-43063e73="" type="button" id="translate-button" class="lfe-form-sz-middle" data-v-52820d90="" style="border-color: rgb(52, 152, 219); background-color: rgb(52, 152, 219);">翻译</button>
        </div>`);
        $transborad.prependTo($("section.side"))
        $transbutton = $("button#translate-button");
        $transbutton.hover(
            function(){ $transbutton.css("background-color", "rgb(52, 152, 219, 0.9)");},
            function(){ $transbutton.css("background-color", "rgb(52, 152, 219)");});
        $transbutton.click(function(){
            let text = uindow.getSelection().toString().trim();
            text = text.replace(new RegExp(" ", "gm"), "+");
            GM_xmlhttpRequest({
                method: "GET",
                url: `http://fanyi.youdao.com/translate?smartresult=dict&smartresult=rule&doctype=json&i=${text}`,
                headers: {
                    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36 Edg/95.0.1020.44",
                },
                onload: function (res) {
                    let ans = res.responseText;
                    ans = JSON.parse(ans);
                    $("p#trans").remove();
                    let anstxt = "";
                    for (let i in ans.translateResult[0]) {
                        anstxt += ans.translateResult[0][i].tgt;
                    }
                    $transbutton.after($(`<p id="trans">${anstxt}</p>`));
                },
                onerror: function (res) {
                    $("p#trans").remove();
                }
            });
        })
    }
    let View = async() => {
        let u = await lg_content("https://www.luogu.com.cn/paste?_contentOnly");
        let flag = 0, pageid1;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 11) !== "#ExViewData") return;
            let k = u.data;
            pageid1 = u.id;
            viewset = JSON.parse(k.substr(11, k.length));
            flag = 1;
            return;
        });
        if (!flag) NewConfig("#ExViewData", viewset);
        flag = 0;
        let pageid2;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 12) !== "#ExChartData") return;
            let k = u.data;
            pageid2 = u.id;
            configs = JSON.parse(k.substr(12, k.length));
            flag = 1;
            return;
        });
        if (flag) {
            var dateStart = new Date(configs.date);
            var dateEnd = new Date();
            var difVal = Math.floor(Math.abs(dateEnd - dateStart) / (1000 * 60 * 60 * 24));
            for (var i in configs)
            {
                if (i == "date") continue;
                if (configs[i] >= difVal * 5)
                    configs[i] -= difVal * 5;
                else configs[i] = 0;
            }
            configs.date = dateEnd.getFullYear() + "-" + (dateEnd.getMonth() + 1) + "-" + dateEnd.getDate();
            EditConfig("#ExChartData", configs, pageid2);
        }
        else NewConfig("#ExChartData", configs);

        flag = 0;
        let Doing;
        for (var i in viewset)
        {
            if (viewset[i] == null) continue;
            let nowDate = new Date(), endDate = new Date(viewset[i].date);
            if (endDate < nowDate)
            { viewset[i] = null; EditConfig("#ExViewData", viewset, pageid1); break; }
            flag = 1;
            Doing = i;
        }

        if (uindow.location.href.match(/record/gi)) {
            if (Doing == "practice_contest" || Doing == "simulation_contest")
                uindow.location.href = "https://www.luogu.com.cn/contest/1";
            return;
        }

        const beDoing = (viewset, Doing, pageid) => {
            $("#cancel-doing-problem").remove();
            $cp = $(`<button data-v-370e72e2="" data-v-43063e73="" type="button" class="lfe-form-sz-middle" data-v-52820d90="" id="cancel-doing-problem" style="border-color: rgb(221, 81, 76); background-color: rgb(221, 81, 76);">取消做题</button>`);
            $cp.hover(
                function(){ $cp.css("background-color", "rgb(221, 81, 76, 0.9)");},
                function(){ $cp.css("background-color", "rgb(221, 81, 76)");});

            if (Doing === "single_problem" || Doing === "dynamic_problem" || Doing === "constructive_problem")
            $cp.prependTo(".operation");
            $("div.card.padding-default").css("display", "none");
            $("div.problem-card").css("display", "block");
            $("#translate").css("display", "block");


            const cancelDoing = () => {
                clearInterval(Timer_board);
                $cp.remove();
                $("div.card.padding-default").css("display", "block");
                $("#timer-board").remove();

                configs[Doing] -= 10;
                EditConfig("#ExChartData", configs, pageid2);

                viewset[Doing] = null;
                EditConfig("#ExViewData", viewset, pageid1);
            }
            const ACcancelDoing = () => {
                clearInterval(Timer_board);
                $cp.remove();
                $("#timer-board").remove();
                $("div.card.padding-default").css("display", "block");

                let finalscore = viewset[Doing].problem[0].span * 7 + 10 - viewset[Doing].problem[0].times;
                configs[Doing] += finalscore;
                EditConfig("#ExChartData", configs, pageid2);

                viewset[Doing] = null;
                EditConfig("#ExViewData", viewset, pageid1);
            }
            if (Doing === "single_problem" || Doing === "dynamic_problem" || Doing === "constructive_problem") {
                let nowtime = new Date();
                let endtime = new Date(viewset[Doing].date);
                nowtime = endtime.getTime() - nowtime.getTime();
                let hour = Math.floor(nowtime / (1000*60*60) % 24),
                    minute = Math.floor(nowtime / (1000*60) % 60),
                    sec = Math.floor(nowtime / 1000 % 60);

                $("#timer-board").remove();
                $(`
                    <div data-v-796309f8="" class="card padding-default" id="timer-board" data-v-6febb0e8="">
                        <h2 data-v-796309f8="" class="lfe-h2" >
                            本题倒计时还有 ${hour > 0? hour + " 小时": ""} ${minute > 0? minute + " 分": ""} ${sec > 0? sec + " 秒钟": ""}
                        </h2>
                        <p>
                            倒计时将结束或题目 AC 后请回到此页面，否则<strong>无法算分</strong>！
                        </p>
                    </div>`).prependTo($("section.side"));
                var Timer_board = setInterval (function () {
                    let nowtime = new Date();
                    let endtime = new Date(viewset[Doing].date);
                    nowtime = endtime.getTime() - nowtime.getTime();
                    if (uindow._feInjection.currentData.problem.accepted == true) {
                        clearInterval(Timer_board);
                        $("#timer-board").remove();
                        ACcancelDoing();
                    }
                    if (nowtime < 1000) {
                        clearInterval(Timer_board);
                        $("#timer-board").remove();
                        if (btflag2 != true) {
                            btflag2 = true;
                            uindow._feInstance.$swal({
                                title: "时间到！  您要重写本题吗",
                                text: "如果不，您将会扣分",
                                type: "question",
                                showCancelButton: true,
                                confirmButtonText: "确定",
                                cancelButtonText: "取消"
                            }).then((result) => {
                                if (result.value) {
                                    var date = new Date();
                                    date = date.getTime() + TimeLong;
                                    $cp.remove();
                                    viewset[Doing] = {"date": new Date(date).getTime(), "problem": [{"pid": uindow._feInjection.currentData.problem.pid, "name": uindow._feInjection.currentData.problem.title, "span": viewset.single_problem.problem[0].span, "times": viewset.single_problem.problem[0].times + 1}]};
                                    EditConfig("#ExViewData", viewset, pageid);
                                    beDoing(viewset, Doing);
                                } else {
                                    cancelDoing();
                                }
                            })
                        }
                    }
                    let hour = Math.floor(nowtime / (1000*60*60) % 24),
                        minute = Math.floor(nowtime / (1000*60) % 60),
                        sec = Math.floor(nowtime / 1000 % 60);
                    $(`#timer-board > h2`).text(`本题倒计时还有 ${hour > 0? hour + " 小时": ""} ${minute > 0? minute + " 分": ""} ${sec > 0? sec + " 秒钟": ""}`);
                }, 1000);
            }
            if (Doing === "practice_contest" || Doing === "simulation_contest")
                $(".lfe-body:eq(0) > a:eq(3)").remove();
            $cp.click(function(){
                uindow._feInstance.$swal({
                    title: "您确定要取消做题吗",
                    text: "如果是，您将会扣分",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "确定",
                    cancelButtonText: "取消"
                }).then((result) => {
                    if (result.value) {
                        cancelDoing();
                    }
                })
            });
        }

        if (!flag)
        {
            if (uindow._feInjection.currentData.problem.accepted !== true)
            {
                let dif = uindow._feInjection.currentData.problem.difficulty;
                if (grade[dif] < configs.single_problem) {
                    if (btflag != true) {
                        btflag = true;
                        uindow._feInstance.$swal({
                            title: "本题难度低，不予计分",
                            type: "warning",
                            showCancelButton: !1,
                            confirmButtonText: "确定",
                        }
                        );
                    }
                }
                else {
                    if (btflag4 != true) {
                        btflag4 = true;
                        uindow._feInstance.$swal({
                            title: "您确定要写本题吗",
                            type: "question",
                            showCancelButton: true,
                            confirmButtonText: "确定",
                            cancelButtonText: "取消"
                        }).then((result) => {
                            if (result.value) {
                                let nowdif = 0;
                                for (nowdif = 1; grade[nowdif] < configs.single_problem; nowdif++);
                                var date = new Date();
                                date = date.getTime() + TimeLong;
                                viewset.single_problem = {"date": new Date(date).getTime(), "problem": [{"pid": uindow._feInjection.currentData.problem.pid, "name": uindow._feInjection.currentData.problem.title, "span": Math.max(uindow._feInjection.currentData.problem.difficulty - nowdif, 0), "times": 0}]};
                                beDoing(viewset, "single_problem", pageid1);
                                EditConfig("#ExViewData", viewset, pageid1);
                            }
                        })
                    }
                }
            }
        }
        else{
            let flag = false;
            let DoingPid;
            for (var i in viewset[Doing].problem)
            {
                if (viewset[Doing].problem[i].pid === uindow._feInjection.currentData.problem.pid)
                { flag = true; break; }
                DoingPid = viewset[Doing].problem[i].pid;
            }
            if (!flag) {
                if (btflag3 != true) {
                    btflag3 = true;
                    uindow._feInstance.$swal({
                        title: "您已经在写其它题了",
                        text: "2 秒后跳转到您正在写的题目",
                        type: "warning",
                        timer: 2000,
                        showConfirmButton: false,
                    }).then(() =>{
                        if (Doing === "single_problem" || Doing === "dynamic_problem" || Doing === "constructive_problem")
                        uindow.location = `/problem/${DoingPid}`;
                        else uindow.location = "/contest/1";
                    })
                }
            }
            else {
                beDoing(viewset, Doing, pageid1);
            }
        }
    };
    if (!uindow.location.href.match(/record/gi)) Translate();
    View();
}, (e) => {
    let now_page = uindow.location.href.slice(33);
    if (now_page !== lst_page) {
        btflag = btflag2 = btflag3 = btflag4 = false;
        flagarr.splice(0, flagarr.length);
        lst_page = now_page;
        return { result: true };
    }
}, () => [], ``)

mod.reg("develop-training", "训练强化", "@/", null, () => {
    let $trboard = $("<div class='am-u-md-4' name='exlg-train-board'></div>");
    $trboard.html(`
        <div class='lg-article exlg-index-stat'>
            <h2>强化训练</h2>
            <div>
                单题：
                <button class="am-btn am-btn-danger am-btn-sm" id="constructive-problem">构造题</button>
                <button class="am-btn am-btn-primary am-btn-sm" id="dynamic-problem">DP 题</button>
                <button class="am-btn am-btn-success am-btn-sm" id="single-problem">练习题</button>
            </div>
            <div>
                比赛：
                <button class="am-btn am-btn-warning am-btn-sm" id="practice-contest">练习赛</button>
                <button class="am-btn am-btn-success am-btn-sm" id="cf-multiple-contest">CF 题</button>
                <button class="am-btn am-btn-danger am-btn-sm" id="simulation-contest">模拟赛</button>
            </div>
            <div id="prolist"></div>
        </div>
    `);
    $("#exlg-rand-nameboard").after($trboard);
    let $board = $(`<div class="am-g" id="ex-chart"></div>`);
    $board.appendTo($(".lg-index-content.am-center"));
    $board.prev().insertAfter($board);
    let $chart = $("div.am-u-md-9");
    let $hc = $(`<div id="container3" class="am-u-md-3-5 am-text-center" style=" height:180px; margin-right: 20px"></div>`);
    $chart.appendTo($board);
    $chart.removeClass();
    $chart.addClass("am-u-md-12");
    $("#container").removeClass("am-u-md-6");
    $("#container").addClass("am-u-md-4-5");
    $("#container2").removeClass("am-u-md-6");
    $("#container2").addClass("am-u-md-4-5");
    $("#container2").after($hc);
    let Config = async() => {
        let u = await lg_content("https://www.luogu.com.cn/paste?_contentOnly");
        let flag = 0, pageid;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 12) !== "#ExChartData") return;
            let k = u.data;
            pageid = u.id;
            configs = JSON.parse(k.substr(12, k.length));
            flag = 1;
            return;
        });
        if (flag) {
            var dateStart = new Date(configs.date + " 0:00:00");
            var dateEnd = new Date();
            var difVal = Math.floor(Math.abs(dateEnd - dateStart) / (1000 * 60 * 60 * 24));
            for (var i in configs)
            {
                if (i == "date") continue;
                if (configs[i] >= difVal * 5)
                    configs[i] -= difVal * 5;
                else configs[i] = 0;
            }
            configs.date = dateEnd.getFullYear() + "-" + (dateEnd.getMonth() + 1) + "-" + dateEnd.getDate();
            EditConfig("#ExChartData", configs, pageid);
        }
        else{
            NewConfig("#ExChartData", configs);
        }
        $("#container3").highcharts({"title":{"text":"","floating":true},"chart":{"backgroundColor":"rgba(0,0,0,0)","type":"area","polar":true},"legend":{"enabled":false},"tooltip":{"shared":true},"xAxis": {"categories": ["构造题", "DP 题", "练习题", "练习赛", "CF 题","模拟赛"],"tickmarkPlacement": "on","lineWidth": 0},"yAxis": {"gridLineInterpolation": "polygon","lineWidth": 0,"min": 0},"series": [{"name": "你的积分","data": [configs.constructive_problem, configs.dynamic_problem, configs.single_problem, configs.practice_contest, configs.cf_multiple_contest, configs.simulation_contest],"pointPlacement": "on"}],"exporting":{"enabled":false},"credits":{"enabled":false}});
        flag = 0;
        let pageid2;
        u.currentData.pastes.result.map((u) => {
            if (flag) return;
            if (u.data.substr(0, 11) !== "#ExViewData") return;
            let k = u.data;
            pageid2 = u.id;
            viewset = JSON.parse(k.substr(11, k.length));
            flag = 1;
            return;
        });
        if (!flag) NewConfig("#ExViewData", viewset);

        let Doingflag = 0, Doing;
        for (var i in viewset)
        {
            if (viewset[i] == null) continue;
            let nowDate = new Date(), endDate = new Date(viewset[i].date);
            if (endDate < nowDate)
            {
                if (i === "single_problem" || i === "dynamic_problem" || i === "constructive_problem") {
                    let res = await lg_content(`/problem/${viewset[i].problem[0].pid}`);
                    if (res.currentData.problem.accepted == true) {
                        let finalscore = viewset[i].problem[0].span * 7 + 10 - viewset[i].problem[0].times;
                        configs[i] += finalscore;
                        EditConfig("#ExChartData", configs, pageid);
                    }
                }
                viewset[i] = null;
                EditConfig("#ExViewData", viewset, pageid2);
                break;
            }
            Doingflag = 1;
            Doing = i;
        }
        if (Doingflag == false) $("#prolist").text("您现在没有在做题");
        else {
            $("#prolist").text("您正在做：");
            for (var i in viewset[Doing].problem)
                $(`<a href="/problem/${viewset[Doing].problem[i].pid}">${viewset[Doing].problem[i].pid} </a>`).appendTo($("#prolist"));
        }
        let randspan = Math.floor(Math.random() * 100), span;
        if (randspan <= 55) span = 0;
        else if (randspan <= 78) span = 1;
        else if (randspan <= 90) span = 2;
        else if (randspan <= 97) span = 3;
        else if (randspan <= 99) span = 4;
        else span = 5;
        $("#single-problem").click(async() => {
            $("#single-problem").prop("disabled", true);

            if (!!Doingflag) {
                lg_alert("您已经在写其它题了");
                $("#single-problem").prop("disabled", false);
                return;
            }

            let nowdif = 0;
            for (nowdif = 1; grade[nowdif] < configs.single_problem; nowdif++);
            span = Math.min(nowdif + span, 7) - nowdif;
            let pType = ["P", "CF", "SP", "AT", "UVA"], pT_idx = Math.floor(Math.random() * 5);
            let res = await lg_content(`/problem/list?difficulty=${nowdif + span}&type=${pType[pT_idx]}&page=1`);
            const
                problem_count = res.currentData.problems.count,
                page_count = Math.ceil(problem_count / 50),
                rand_page = Math.floor(Math.random() * page_count) + 1;
            res = await lg_content(`/problem/list?difficulty=${nowdif + span}&type=${pType[pT_idx]}&page=${rand_page}`);

            let
                list = res.currentData.problems.result,
                rand_idx = Math.floor(Math.random() * list.length);
            while (list[rand_idx].accepted == true && list.length > 0)
                list.splice(rand_idx, 1),
                rand_idx = Math.floor(Math.random() * list.length);
            if (list.length <= 0) {
                $("#single-problem").prop("disabled", false);
                lg_alert("出错了，重来一次吧！");
                return;
            }
            $("#single-problem").prop("disabled", false);
            var date = new Date();
            date = date.getTime() + TimeLong;
            viewset.single_problem = {"date": new Date(date).getTime(), "problem": [{"pid": list[rand_idx].pid, "name": list[rand_idx].title, "span": span, "times": 0}]};
            EditConfig("#ExViewData", viewset, pageid2);
            location.href = `/problem/${list[rand_idx].pid}`;
        })

        $("#constructive-problem").click(async() => {
            $("#constructive-problem").prop("disabled", true);

            if (!!Doingflag) {
                lg_alert("您已经在写其它题了");
                $("#constructive-problem").prop("disabled", false);
                return;
            }

            let nowdif = 0;
            for (nowdif = 1; grade[nowdif] < configs.constructive_problem; nowdif++);
            span = Math.min(nowdif + span, 7) - nowdif;
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://codeforces.com/api/problemset.problems?tags=constructive%20algorithms`,
                onload: async (res) => {
                    res = res.responseText;
                    res = JSON.parse(res);
                    let list = res.result.problems;
                    list = list.filter(function(item){
                        return (nowdif + span > 1? grade[nowdif + span - 1]: 0) < item.rating && item.rating <= grade[nowdif + span];
                    })
                    let rand_idx = Math.floor(Math.random() * list.length);

                    let result = await lg_content(`https://www.luogu.com.cn/problem/CF${list[rand_idx].contestId}${list[rand_idx].index}?_contentOnly`);
                    while ((result.currentData.problem.accepted == true ||
                        result.currentData.problem.difficulty > 0 && result.currentData.problem.difficulty < nowdif + span) &&
                        list.length > 0)

                        list.splice(rand_idx, 1),
                        rand_idx = Math.floor(Math.random() * list.length),
                        result = await lg_content(`https://www.luogu.com.cn/problem/CF${list[rand_idx].contestId}${list[rand_idx].index}?_contentOnly`);
                    if (list.length <= 0) {
                        $("#constructive-problem").prop("disabled", false);
                        configs.constructive_problem = grade[nowdif + span] + 1;
                        EditConfig("#ExChartData", configs, pageid);
                        lg_alert("出错了，重来一次吧！");
                        return;
                    }
                    $("#constructive-problem").prop("disabled", false);
                    var date = new Date();
                    date = date.getTime() + TimeLong;
                    viewset.constructive_problem = {"date": new Date(date).getTime(), "problem": [{"pid": `CF${list[rand_idx].contestId}${list[rand_idx].index}`, "name": list[rand_idx].name, "span": (result.currentData.problem.difficulty > 0? result.currentData.problem.difficulty - nowdif: span), "times": 0}]};
                    EditConfig("#ExViewData", viewset, pageid2);
                    location.href = `/problem/CF${list[rand_idx].contestId}${list[rand_idx].index}`;
                },
                onerror: function (res) {
                    $("#constructive-problem").prop("disabled", false);
                    lg_alert("无法连接到 Codeforces");
                }
            })
        })

        $("#dynamic-problem").click(async() => {
            $("#dynamic-problem").prop("disabled", true);
            if (!!Doingflag) {
                lg_alert("您已经在写其它题了");
                $("#dynamic-problem").prop("disabled", false);
                return;
            }
            let nowdif = 0;
            for (nowdif = 1; grade[nowdif] < configs.dynamic_problem; nowdif++);
            span = Math.min(nowdif + span, 7) - nowdif;
            let which = Math.floor(Math.random() * 2);
            if (which == 1) {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://codeforces.com/api/problemset.problems?tags=dp`,
                    onload: async (res) => {
                        res = res.responseText;
                        res = JSON.parse(res);
                        let list = res.result.problems;
                        list = list.filter(function(item){
                            return (nowdif + span > 1? grade[nowdif + span - 1]: 0) < item.rating && item.rating <= grade[nowdif + span];
                        })
                        let rand_idx = Math.floor(Math.random() * list.length);

                        let result = await lg_content(`https://www.luogu.com.cn/problem/CF${list[rand_idx].contestId}${list[rand_idx].index}?_contentOnly`);
                        while ((result.currentData.problem.accepted == true ||
                            result.currentData.problem.difficulty > 0 && result.currentData.problem.difficulty < nowdif + span) &&
                            list.length > 0)
                            list.splice(rand_idx, 1),
                            rand_idx = Math.floor(Math.random() * list.length),
                            result = await lg_content(`https://www.luogu.com.cn/problem/CF${list[rand_idx].contestId}${list[rand_idx].index}?_contentOnly`);
                        if (list.length <= 0) {
                            $("#dynamic-problem").prop("disabled", false);
                            configs.dynamic_problem = grade[nowdif + span] + 1;
                            EditConfig("#ExChartData", configs, pageid);
                            lg_alert("出错了，重来一次吧！");
                            return;
                        }
                        $("#dynamic-problem").prop("disabled", false);
                        var date = new Date();
                        date = date.getTime() + TimeLong;
                        viewset.dynamic_problem = {"date": new Date(date).getTime(), "problem": [{"pid": `CF${list[rand_idx].contestId}${list[rand_idx].index}`, "name": list[rand_idx].name, "span": (result.currentData.problem.difficulty > 0? result.currentData.problem.difficulty - nowdif: span), "times": 0}]};
                        EditConfig("#ExViewData", viewset, pageid2);
                        location.href = `/problem/CF${list[rand_idx].contestId}${list[rand_idx].index}`;
                    },
                    onerror: function (res) {
                        $("#dynamic-problem").prop("disabled", false);
                        lg_alert("无法连接到 Codeforces...出错了，重来一次吧！");
                    }
                })
            } else {
                let pType = ["P", "SP", "AT", "UVA"], pT_idx = Math.floor(Math.random() * 4);
                let res = await lg_content(`/problem/list?difficulty=${nowdif + span}&type=${pType[pT_idx]}&page=1&tag=3`);
                const
                    problem_count = res.currentData.problems.count,
                    page_count = Math.ceil(problem_count / 50),
                    rand_page = Math.floor(Math.random() * page_count) + 1;
                res = await lg_content(`/problem/list?difficulty=${nowdif + span}&type=${pType[pT_idx]}&page=${rand_page}&tag=3`);

                let
                    list = res.currentData.problems.result,
                    rand_idx = Math.floor(Math.random() * list.length);
                while (list[rand_idx].accepted === true && list.length > 0)
                    list.splice(rand_idx, 1),
                    rand_idx = Math.floor(Math.random() * list.length);
                if (list.length <= 0) {
                    $("#dynamic-problem").prop("disabled", false);
                    lg_alert("出错了，重来一次吧！");
                    return;
                }
                $("#dynamic-problem").prop("disabled", false);
                var date = new Date();
                date = date.getTime() + TimeLong;
                viewset.dynamic_problem = {"date": new Date(date).getTime(), "problem": [{"pid": list[rand_idx].pid, "name": list[rand_idx].title, "span": span, "times": 0}]};
                EditConfig("#ExViewData", viewset, pageid2);
                location.href = `/problem/${list[rand_idx].pid}`;
            }
        })
        $("#practice-contest").click(async() => {
            $("#practice-contest").prop("disabled", true);
            if (!!Doingflag) {
                lg_alert("您已经在写其它题了");
                $("#practice-contest").prop("disabled", false);
                return;
            }
            let nowdif = 0;
            for (nowdif = 1; grade[nowdif] < configs.practice_contest; nowdif++);
            span = Math.min(nowdif + 1, 7) - nowdif;
            var date = new Date();
            date = date.getTime() + TimeLong * 4;
            viewset.practice_contest = {"date": new Date(date).getTime(), "TimeLong": 4.00, "problem": []};
            for (let i = 0; i < 4;)
            {
                let pType = ["P", "CF", "SP", "AT", "UVA"], pT_idx = Math.floor(Math.random() * 5);
                let res = await lg_content(`/problem/list?difficulty=${nowdif + (i == 3? span: 0)}&type=${pType[pT_idx]}&page=1`);
                const
                    problem_count = res.currentData.problems.count,
                    page_count = Math.ceil(problem_count / 50),
                    rand_page = Math.floor(Math.random() * page_count) + 1;
                res = await lg_content(`/problem/list?difficulty=${nowdif + (i == 3? span: 0)}&type=${pType[pT_idx]}&page=${rand_page}`);

                let
                    list = res.currentData.problems.result,
                    rand_idx = Math.floor(Math.random() * list.length);
                while (list[rand_idx].accepted == true && list.length > 0)
                    list.splice(rand_idx, 1),
                    rand_idx = Math.floor(Math.random() * list.length);
                if (list.length <= 0) { continue; }
                viewset.practice_contest.problem.push({"pid": list[rand_idx].pid, "name": list[rand_idx].title, "index": String.fromCharCode(i + 65), "fullScore": list[rand_idx].fullScore});
                i++;
            }
            $("#practice-contest").prop("disabled", false);
            EditConfig("#ExViewData", viewset, pageid2);
            location.href = `contest/1`;
        })
        $("#cf-multiple-contest").click(async() => {
            $("#cf-multiple-contest").prop("disabled", true);
            if (!!Doingflag) {
                lg_alert("您已经在写其它题了");
                $("#cf-multiple-contest").prop("disabled", false);
                return;
            }
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://codeforces.com/api/contest.list`,
                onload: async (res) => {
                    res = JSON.parse(res.responseText).result;
                    let nowdif = configs.cf_multiple_contest;
                    res = res.filter(function(item){
                        return ((item.name.match(/Div. 1/gi) && nowdif >= 1900) ||
                        (item.name.match(/Div. 2/gi) && nowdif <= 2099) ||
                        (item.name.match(/Div. 3/gi) && nowdif <= 1399) ||
                        item.name.match(/Div. 1 + Div. 2/gi) ||
                        item.name.match(/Global/gi)) && (item.phase.match(/FINISHED/gi));
                    })
                    let rand_idx = Math.floor(Math.random() * res.length), contestid = res[rand_idx].id;
                    var date = new Date();
                    viewset.cf_multiple_contest = {"date": date.getTime() + res[rand_idx].durationSeconds * 1000, "TimeLong": res[rand_idx].durationSeconds / 3600, "problem": []};
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: `https://codeforces.com/contest/${contestid}`,
                        onload: async (result) => {
                            result = result.responseText;
                            var s = document.createElement('div'); s.innerHTML = result;
                            let htmllist = s.querySelectorAll("td.id > a");
                            let list = [];
                            for (let i = 0; i < htmllist.length; i++) {
                                list[i] = htmllist[i].text.replace(/\ +/g,"").replace(/[\r\n]/g,"");
                            }
                            for (let i = 0; i < list.length; i++) {
                                let u = await lg_content(`/problem/CF${contestid}${list[i]}?_contentOnly`);
                                u = u.currentData.problem;
                                viewset.cf_multiple_contest.problem.push({"pid": `CF${contestid}${list[i]}`, "name": u.title, "index": `${list[i]}`, "fullScore": u.fullScore});
                            }
                            $("#practice-contest").prop("disabled", false);
                            EditConfig("#ExViewData", viewset, pageid2);
                            location.href = `contest/1`;
                        },
                        onerror: function (result) {
                            $("#cf-multiple-contest").prop("disabled", false);
                            lg_alert("无法连接到 Codeforces...");
                        }
                    })
                },
                onerror: function (res) {
                    $("#cf-multiple-contest").prop("disabled", false);
                    lg_alert("无法连接到 Codeforces...");
                }
            })
        })
        $("#simulation-contest").click(async() => {
            $("#simulation-contest").prop("disabled", true);
            if (!!Doingflag) {
                lg_alert("您已经在写其它题了");
                $("#simulation-contest").prop("disabled", false);
                return;
            }
            let nowdif = 0;
            for (nowdif = 1; grade[nowdif] < configs.simulation_contest; nowdif++);
            if (nowdif == 4) nowdif = 5;
            if (nowdif >= 5) nowdif += 3;
            span = Math.min(nowdif + 1, 7) - nowdif;
            var date = new Date();
            date = date.getTime() + TimeLong * 4;
            viewset.simulation_contest = {"date": new Date(date).getTime(), "TimeLong": 4.00, "problem": []};
            for (let i = 0; i < 4;)
            {
                let pType = ["P", "CF", "SP", "AT", "UVA"], pT_idx = Math.floor(Math.random() * 5);
                let difarr = [4, 5, 6, 6], difrnd = Math.floor(Math.random() * 10) + 1 <= nowdif;
                let res = await lg_content(`/problem/list?difficulty=${difarr[i] + difrnd}&type=${pType[pT_idx]}&page=1`);
                const
                    problem_count = res.currentData.problems.count,
                    page_count = Math.ceil(problem_count / 50),
                    rand_page = Math.floor(Math.random() * page_count) + 1;
                res = await lg_content(`/problem/list?difficulty=${difarr[i] + difrnd}&type=${pType[pT_idx]}&page=${rand_page}`);

                let
                    list = res.currentData.problems.result,
                    rand_idx = Math.floor(Math.random() * list.length);
                while (list[rand_idx].accepted == true && list.length > 0)
                    list.splice(rand_idx, 1),
                    rand_idx = Math.floor(Math.random() * list.length);
                if (list.length <= 0) { continue; }
                viewset.simulation_contest.problem.push({"pid": list[rand_idx].pid, "name": list[rand_idx].title, "index": String.fromCharCode(i + 65), "fullScore": list[rand_idx].fullScore});
                i++;
            }
            $("#simulation-contest").prop("disabled", false);
            EditConfig("#ExViewData", viewset, pageid2);
            location.href = `contest/1`;

        })
    };

    Config();
}, `
.am-u-md-4-5 {
    width: 37.5%
}
.am-u-md-3-5 {
    width: 25%
}
`)


mod.reg("rand-problem-ex", "随机跳题ex", "@/", {
    exrand_difficulty: {
        ty: "tuple",
        lvs: [
            { ty: "boolean", dft: false, strict: true, repeat: 8 }
        ],
        priv: true
    },
    exrand_source: {
        ty: "tuple",
        lvs: [
            { ty: "boolean", dft: false, strict: true, repeat: 5 }
        ],
        priv: true
    }
}, ({msto}) => {
    const dif_list = [
        {
            text: "入门",
            color: "red",
            id: 1
        },
        {
            text: "普及-",
            color: "orange",
            id: 2
        },
        {
            text: "普及/提高-",
            color: "yellow",
            id: 3
        },
        {
            text: "普及+/提高",
            color: "green",
            id: 4
        },
        {
            text: "提高+/省选-",
            color: "blue",
            id: 5
        },
        {
            text: "省选/NOI-",
            color: "purple",
            id: 6
        },
        {
            text: "NOI/NOI+/CTSC",
            color: "black",
            id: 7
        },
        {
            text: "暂无评定",
            color: "gray",
            id: 0
        }
    ]
    const src_list = [
        {
            text: "洛谷题库",
            color: "red",
            id: "P"
        },
        {
            text: "Codeforces",
            color: "orange",
            id: "CF"
        },
        {
            text: "SPOJ",
            color: "yellow",
            id: "SP"
        },
        {
            text: "ATcoder",
            color: "green",
            id: "AT"
        },
        {
            text: "UVA",
            color: "blue",
            id: "UVA"
        }
    ]

    const func_jump_problem = (str) => { // Note: 跳转题目
        if (judge_problem(str)) str = str.toUpperCase()
        if (str === "" || typeof (str) === "undefined") uindow.show_alert("提示", "请输入题号")
        else location.href = "https://www.luogu.com.cn/problemnew/show/" + str
    }

    let mouse_on_board = false, mouse_on_dash = false

    // Note: 重新构建界面
    let $input = $("input[name='toproblem']")
    $input.after($input.clone()).remove()
    $input = $("input[name='toproblem']")

    let $jump = $(".am-btn[name='goto']")
    $jump.after($jump.clone()).remove()
    $jump = $(".am-btn[name='goto']")

    const $btn_list = $jump.parent()

    $(".am-btn[name='gotorandom']").text("随机")
    const $jump_exrand = $(`<button class="am-btn am-btn-success am-btn-sm" name="gotorandomex">随机ex</button>`).appendTo($btn_list)

    $jump.on("click", () => {
        if (/^[0-9]+.?[0-9]*$/.test($input.val())) $input.val("P" + $input.val())
        func_jump_problem($input.val())
    })
    $input.on("keydown", e => {
        if (e.keyCode === 13) $jump.click()
    })
    // Note: board
    const $board = $(`<span id="exlg-exrand-window" class="exlg-window" style="display: block;">
    <br>
    <ul></ul>
    </span>`).appendTo($btn_list).hide()
        .mouseenter(() => {mouse_on_board = true})
        .mouseleave(() => {
            mouse_on_board = false
            if (!mouse_on_dash) {
                $board.hide()
            } // Hack: 维护onboard
        })
    $(".lg-index-stat>h2").text("问题跳转 ").append($(`<div id="exlg-dash-0" class="exlg-rand-settings">ex设置</div>`))
    const $ul = $board.children("ul").css("list-style-type", "none")

    const $exrand_menu = $(`<div id="exlg-exrand-menu"></div>`).appendTo($ul)
    $("<br>").appendTo($ul)
    const $exrand_diff = $(`<div id="exlg-exrand-diff" class="smallbtn-list"></div>`).appendTo($ul)
    const $exrand_srce = $(`<div id="exlg-exrand-srce" class="smallbtn-list"></div>`).appendTo($ul).hide()

    const $entries = $.double((text) => $(`<div class="exlg-rand-settings exlg-unselectable exrand-entry">${text}</div>`).appendTo($exrand_menu), "题目难度", "题目来源")
    $entries[0].after($(`<span class="exlg-unselectable">&nbsp;&nbsp;</span>`))
    $entries[0].addClass("selected").css("margin-right", "38px")

    $.double(([$entry, $div]) => {
        $entry.on("click", () => {
            $(".exrand-entry").removeClass("selected")
            $entry.addClass("selected")
            $(".smallbtn-list").hide()
            $div.show()
        })
    }, [$entries[0], $exrand_diff], [$entries[1], $exrand_srce])

    $.double(([$parent, obj_list, msto_proxy]) => {
        const $lists = $.double(([classname, desctext]) => $(`<span class="${classname}">
        <span class="lg-small lg-inline-up exlg-unselectable">${desctext}</span>
        <br>
        </span>`).appendTo($parent), ["exrand-enabled", "已选择"], ["exrand-disabled", "未选择"])
        obj_list.forEach((obj, index) => {
            const $btn = $.double(($p) => $(`<div class="exlg-smallbtn exlg-unselectable">${obj.text}</div>`).css("background-color", `var(--lg-${obj.color}-problem)`).appendTo($p), $lists[0], $lists[1])
            $.double((b) => {
                $btn[b].on("click", () => {
                    $btn[b].hide()
                    $btn[1 - b].show()
                    msto_proxy[index] = !! b
                })
                if (msto_proxy[index] === (!! b)) $btn[b].hide()
            }, 0, 1)
        })
    }, [$exrand_diff, dif_list, msto.exrand_difficulty], [$exrand_srce, src_list, msto.exrand_source])

    $("#exlg-dash-0").mouseenter(() => {
        mouse_on_dash = true

        $.double(([$p, mproxy]) => {
            const _$smalldash = [$p.children(".exrand-enabled").children(".exlg-smallbtn"), $p.children(".exrand-disabled").children(".exlg-smallbtn")]

            $.double(([jqstr, bln]) => {
                $p.children(jqstr).children(".exlg-smallbtn").each((i, e, $e = $(e)) => (mproxy[i] === bln) ? ($e.show()) : ($e.hide()))
            }, [".exrand-enabled", true], [".exrand-disabled", false])
        }, [$exrand_diff, msto.exrand_difficulty], [$exrand_srce, msto.exrand_source]) // Hack: 防止开两个页面瞎玩的情况
        $board.show() // Hack: 鼠标放在dash上开window
    })
        .mouseleave(() => {
            mouse_on_dash = false // Hack: 离开dash和board超过200ms直接关掉
            if (!mouse_on_board) {
                setTimeout(() => {
                    if (!mouse_on_board) $board.hide()
                }, 200)
            }
        })

    const exrand_poi = async () => { // Note: 异步写法（用到了lg_content）
        const result = $.double(([l, msto_proxy, _empty]) => {
            let g = []
            l.forEach((e, i) => {
                if (msto_proxy[i]) g.push(e.id)
            })
            if (!g.length) g = _empty
            return g[Math.floor(Math.random() * g.length)]
        }, [dif_list, msto.exrand_difficulty, [0, 1, 2, 3, 4, 5, 6, 7]], [src_list, msto.exrand_source, ["P"]])
        let res = await lg_content(`/problem/list?difficulty=${result[0]}&type=${result[1]}&page=1`)

        const
            problem_count = res.currentData.problems.count,
            page_count = Math.ceil(problem_count / 50),
            rand_page = Math.floor(Math.random() * page_count) + 1

        res = await lg_content(`/problem/list?difficulty=${result[0]}&type=${result[1]}&page=${rand_page}`)
        const
            list = res.currentData.problems.result,
            rand_idx = Math.floor(Math.random() * list.length),
            pid = list[rand_idx].pid
        location.href = `/problem/${pid}`
    }

    $jump_exrand.on("click", exrand_poi)
},`

.exlg-rand-settings {
    position: relative;
    display: inline-block;
    padding: 1px 5px 1px 5px;
    background-color: white;
    border: 1px solid #6495ED;
    color: cornflowerblue;
    border-radius: 6px;
    font-size: 12px;
    position: relative;
    top: -2px;
}
.exlg-rand-settings.selected {
    background-color: cornflowerblue;
    border: 1px solid #6495ED;
    color: white;
}
.exlg-rand-settings:hover {
    box-shadow: 0 0 7px dodgerblue;
}
.exlg-smallbtn {
    position: relative;
    display: inline-block;
    padding: 1px 5px 1px;
    color: white;
    border-radius: 6px;
    font-size: 12px;
    margin-left: 1px;
    margin-right: 1px;
}
.exlg-window {
    position: absolute;
    top: 35px;
    left: 0px;
    z-index: 65536;
    display: none;
    width: 250px;
    height: 300px;
    padding: 5px;
    background: white;
    color: black;
    border-radius: 7px;
    box-shadow: rgb(187 227 255) 0px 0px 7px;
}
.exrand-enabled{
    width: 49%;
    float: left;
}
.exrand-disabled{
    width: 49%;
    float: right;
}
`)

mod.reg_hook_new("code-block-ex", "代码块优化", "@/.*", {
    show_code_lang : { ty: "boolean", dft: true, strict: true, info: [ "Show Language Before Codeblocks", "显示代码块语言" ] },
    copy_code_position : { ty: "enum", vals: [ "left", "right" ], dft: "left", info: [ "Copy Button Position", "复制按钮对齐方式" ] },
    code_block_title : { ty: "string", dft: "源代码 - ${lang}", info: [ "Custom Code Title", "自定义代码块标题" ] },
    copy_code_font : { ty: "string", dft: "'Fira Code', Consolas, monospace", info: [ "Code Block Font", "代码块字体" ], strict: true },
    max_show_lines : { ty: "number", dft: -1, min: -1, max: 100, info: [ "Max Lines On Show", "代码块最大显示行数" ], strict: true }
},  ({ msto, args }) => {

    const isRecord = /\/record\/.*/.test(location.href)

    const langs = {
        c: "C", cpp: "C++", pascal: "Pascal", python: "Python", java: "Java", javascript: "JavaScript", php: "PHP", latex: "LaTeX"
    }

    const get_lang = $code => {
        let lang = "undefined"
        if (isRecord) return $($(".value.lfe-caption")[0]).text()
        if ($code.attr("data-rendered-lang")) lang = $code.attr("data-rendered-lang")
        else if ($code.attr("class")) $code.attr("class").split(" ").forEach(cls => {
            if (cls.startsWith("language-")) lang = cls.slice(9)
        })
        return langs[lang]
    }

    args.attr("exlg-copy-code-block", "")

    args.each((_, e, $pre = $(e)) => {
        if (e.parentNode.className === "mp-preview-content" || e.parentNode.parentNode.className === "mp-preview-area") return
        const $btn = isRecord
            ? ($pre.children(".copy-btn"))
            : $(`<div class="exlg-copy">复制</div>`)
                .on("click", () => {
                    if ($btn.text() !== "复制") return // Note: Debounce
                    $btn.text("复制成功").toggleClass("exlg-copied")
                    setTimeout(() => $btn.text("复制").toggleClass("exlg-copied"), 800)
                    GM_setClipboard($pre.text(), { type: "text", mimetype: "text/plain" })
                })

        const $code = $pre.children("code")
        $code.css("font-family", msto.copy_code_font || undefined)
        if (! $code.hasClass("hljs")) $code.addClass("hljs").css("background", "white")
        $btn.addClass(`exlg-copy-${msto.copy_code_position}`)

        const lang = get_lang($code)
        const title_text = ((msto.show_code_lang && lang) ? ( msto.code_block_title.replace("${lang}", lang)) : ("源代码"))
        const $title = isRecord ? $(".lfe-h3").text(title_text) : $(`<h3 class="exlg-code-title" style="width: 100%;">${title_text}</h3>`)

        if (! isRecord) $pre.before($title.append($btn))
    })
}, (e) => {
    const $tar = $(e.target).find("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])")
    return {
        result: $tar.length,
        args: $tar
    }
}, () => $("pre:has(> code:not(.cm-s-default)):not([exlg-copy-code-block])"), `
.exlg-copy {
    position: relative;
    display: inline-block;
    border: 1px solid #3498db;
    border-radius: 3px;
    background-color: rgba(52, 152, 219, 0);
    color: #3498db;
    font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", "Noto Sans", "Noto Sans CJK SC", "Noto Sans CJK", "Source Han Sans", "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif;
    flex: none;
    outline: 0;
    cursor: pointer;
    font-weight: normal;
    line-height: 1.5;
    text-align: center;
    vertical-align: middle;
    background: 0 0;
    font-size: 12px;
    padding: 0 5px;
    margin-left: 1px;
}
.exlg-copy.exlg-copy-right {
    float: right;
}
.exlg-copy:hover {
    background-color: rgba(52, 152, 219, 0.1);
}
div.exlg-copied {
    background-color: rgba(52, 152, 219, 0.9)!important;
    color: white!important;
}
.copy-btn {
    font-size: .8em;
    padding: 0 5px;
}
.lfe-form-sz-middle {
    font-size: 0.875em;
    padding: 0.313em 1em;
}
.exlg-code-title {
    margin: 0;
    font-family: inherit;
    font-size: 1.125em;
    color: inherit;
}
`)

mod.reg_hook_new("rand-training-problem", "题单内随机跳题", "@/training/[0-9]+(#.*)?", {
    mode: { ty: "enum", vals: ["unac only", "unac and new", "new only"], dft : "unac and new", info: [
        "Preferences about problem choosing", "随机跳题的题目种类"
    ] }
}, ({ msto, args }) => {
    let ptypes = msto.mode.startsWith("unac") + msto.mode.endsWith("only") * (-1) + 2
    if (! args.length) return // Hack: 这一步明明 result 已经是 0 的情况下还把参数传进去了导致RE，鬼知道什么 bug
    $(args[0].firstChild).clone(true)
        .appendTo(args)
        .text("随机跳题")
        .addClass("exlg-rand-training-problem-btn")
        .on("click", () => {
            const tInfo = uindow._feInjection.currentData.training
            let candProbList = []

            tInfo.problems.some(pb => {
                if (tInfo.userScore.score[pb.problem.pid] === null) {
                    if (ptypes & 1)
                        candProbList.push(pb.problem.pid)
                }
                else if (tInfo.userScore.score[pb.problem.pid] < pb.problem.fullScore && (ptypes & 2))
                    candProbList.push(pb.problem.pid)
            })

            if (!tInfo.problemCount)
                return lg_alert("题单不能为空")
            else if (!candProbList.length) {
                if (ptypes === 1)
                    return lg_alert("您已经做完所有新题啦！")
                else if (ptypes === 2)
                    return lg_alert("您已经订完所有错题啦！")
                else
                    return lg_alert("您已经切完所有题啦！")
            }

            const pid = ~~ (Math.random() * 1.e6) % candProbList.length
            location.href = "https://www.luogu.com.cn/problem/" + candProbList[pid]
        })
}, (e) => {
    const $tmp = $(e.target).find("div.operation")
    return { result: $tmp.length > 0, args: $tmp }
}, () => $("div.operation"), `
.exlg-rand-training-problem-btn {
    border-color: rgb(52, 52, 52);
    background-color: rgb(52, 52, 52);
}
`)

mod.reg("tasklist-ex", "任务计划ex", "@/", {
    auto_clear: { ty: "boolean", dft: true, info: ["Hide accepted problems", "隐藏已经 AC 的题目"] },
    rand_problem_in_tasklist: { ty: "boolean", dft: true, info: ["Random problem in tasklist", "任务计划随机跳题"]}
}, ({ msto }) => {
    /* const _$board = $("button[name=task-edit]").parent().parent() // Note: 如果直接$div:has(.tasklist-item) 那么当任务计划为空.. */
    let actTList = []
    $.each($("div.tasklist-item"), (_, prob, $e = $(prob)) => {
        const pid = $e.attr("data-pid")

        if (prob.innerHTML.search(/check/g) === -1) {
            if (msto.rand_problem_in_tasklist)
                actTList.push(pid)
        }
        if ($e.find("i").hasClass("am-icon-check")) $e.addClass("tasklist-ac-problem")
    })

    const $toggle_AC = $(`<div>[<a id="toggle-button">隐藏已AC</a>]</div>`)
    $("button[name=task-edit]").parent().after($toggle_AC)

    const $ac_problem = $(".tasklist-ac-problem")
    const $toggle = $("#toggle-button").on("click", () => {
        $ac_problem.toggle()
        $toggle.text([ "隐藏", "显示" ][ + (msto.auto_clear = ! msto.auto_clear) ] + "已 AC")
    })

    if (msto.auto_clear) $toggle.click()

    if (msto.rand_problem_in_tasklist) {
        let $btn = $(`<button name="task-rand" class="am-btn am-btn-sm am-btn-success lg-right">随机</button>`)
        $("button[name='task-edit']").before($btn)
        $btn.addClass("exlg-rand-tasklist-problem-btn")
            .click(() => {
                let tid = ~~ (Math.random() * 1.e6) % actTList.length
                location.href += `problem/${ actTList[tid] }`
            })
    }
}, `
.exlg-rand-tasklist-problem-btn {
    margin-left: 0.5em;
}
`)

mod.reg("dbc-jump", "双击题号跳题", "@/.*", null, () => {
    $(document).on("dblclick", e => {
        const pid = window.getSelection().toString().trim().toUpperCase()
        const url = e.ctrlkey
            ? $(".ops > a[href*=blog]").attr("href") + "solution-"
            : "https://www.luogu.com.cn/problem/"
        if (judge_problem(pid)) window.open(url + pid)
    })
})

let lst_page = -1
mod.reg_hook_new("submission-color", "记录难度可视化", "@/record/list.*", null, () => {
    const func = async() => {
        if ($(".exlg-difficulty-color").length) return;
        let u = await lg_content(uindow.location.href)
        const dif = u.currentData.records.result.map((u) => u.problem.difficulty)
        $("div.problem > div > a > span.pid").each((i, e, $e = $(e)) => {
            // console.log(u.currentData.records.result[i].problem.pid, i)
            $e.removeClass();
            $e.addClass("pid").addClass("exlg-difficulty-color").addClass(`color-${dif[i]}`)
        })
    }
    func()
}, (e) => {
    if(!uindow.location.href.match("www.luogu.com.cn/record/list.*")) return {result: false}
    let now_page = uindow.location.href.slice(37);
    if (now_page !== lst_page) {lst_page = now_page; return {result: !$("div.problem > div > a > span.pid").hasClass("exlg-difficulty-color")};}

}, () => [], ``
)


mod.reg("keyboard-and-cli", "键盘操作与命令行", "@/.*", {
    lang: { ty: "enum", dft: "en", vals: [ "en", "zh" ] }
}, ({ msto }) => {
    const $cli = $(`<div id="exlg-cli" exlg="exlg"></div>`).appendTo($("body"))
    const $cli_input = $(`<input id="exlg-cli-input" />`).appendTo($cli)

    let cli_is_log = false
    const cli_log = (sp, ...tp) => {
        cli_is_log = true
        const m = sp.map((s, i) =>
            s.split(/\b/).map(w => cli_lang_dict[w]?.[ cli_lang - 1 ] ?? w).join("") +
            (tp[i] || "")
        ).join("")
        return $cli_input.val(m)
    }
    const cli_error = (sp, ...tp) =>
        warn(cli_log(sp, ...tp).addClass("error").val())
    const cli_clean = () => {
        cli_is_log = false
        return $cli_input.val("").removeClass("error")
    }
    const cli_history = []
    let cli_history_index = 0
    const cli_langs = [ "en", "zh" ], cli_lang_dict = {
        ".": [ "。" ],
        ",": [ "，" ],
        "!": [ "！" ],
        "?": [ "？" ],
        "cli":        [ "命令行" ],
        "current":    [ "当前" ],
        "language":   [ "语言" ],
        "available":  [ "可用" ],
        "command":    [ "命令" ],
        "commands":   [ "命令" ],
        "unknown":    [ "未知" ],
        "forum":      [ "板块" ],
        "target":     [ "目标" ],
        "mod":        [ "模块" ],
        "action":     [ "操作" ],
        "illegal":    [ "错误" ],
        "param":      [ "参数" ],
        "expected":   [ "期望" ],
        "type":       [ "类型" ],
        "lost":       [ "缺失" ],
        "essential":  [ "必要" ],
        "user":       [ "用户" ]
    }
    let cli_lang = cli_langs.indexOf(msto.lang) || 0

    const cmds = {
        help: (cmd/* string*/) => {
            /* get the help of <cmd>. or list all cmds. */
            /* 获取 <cmd> 的帮助。空则列出所有。 */
            if (! cmd)
                cli_log`exlg cli. current language: ${cli_lang}, available commands: ${ Object.keys(cmds).join(", ") }`
            else {
                const f = cmds[cmd]
                if (! f) return cli_error`help: unknown command "${cmd}"`

                const arg = f.arg.map(a => {
                    const i = a.name + ": " + a.type
                    return a.essential ? `<${i}>` : `[${i}]`
                }).join(" ")
                cli_log`${cmd} ${arg} ${ f.help[cli_lang] }`
            }
        },
        cd: (path/* !string*/) => {
            /* jump to <path>, relative path is OK. */
            /* 跳转至 <path>，支持相对路径。 */
            let tar
            if (path[0] === "/") tar = path
            else {
                const pn = location.pathname.replace(/^\/+/, "").split("/")
                const pr = path.split("/")
                pr.forEach(d => {
                    if (d === ".") return
                    if (d === "..") pn.pop()
                    else pn.push(d)
                })
                tar = pn.join("/")
            }
            location.href = location.origin + "/" + tar.replace(/^\/+/, "")
        },
        cdd: (forum/* !string*/) => {
            /* jump to the forum named <forum> of discussion. use all the names you can think of. */
            /* 跳转至名为 <forum> 的讨论板块，你能想到的名字基本都有用。 */
            const tar = [
                [ "relevantaffairs",    "gs", "gsq",    "灌水", "灌水区",               "r", "ra" ],
                [ "academics",          "xs", "xsb",    "学术", "学术版",               "a", "ac" ],
                [ "siteaffairs",        "zw", "zwb",    "站务", "站务版",               "s", "sa" ],
                [ "problem",            "tm", "tmzb",   "题目", "题目总版",             "p"       ],
                [ "service",            "fk", "fksqgd", "反馈", "反馈、申请、工单专版",      "se" ]
            ]
            forum = tar.find(ns => ns.includes(forum))?.[0]
            if (! tar) return cli_error`cdd: unknown forum "${forum}"`
            cmds.cd(`/discuss/lists?forumname=${forum}`)
        },
        cc: (name/* char*/) => {
            /* jump to [name], "h|p|c|r|d|i|m|n" stands for home|problem|contest|record|discuss|I myself|message|notification. or jump home. */
            /* 跳转至 [name]，"h|p|c|r|d|i|m|n" 代表：主页|题目|比赛|评测记录|讨论|个人中心|私信|通知。空则跳转主页。 */
            name = name || "h"
            const tar = {
                h: "/",
                p: "/problem/list",
                c: "/contest/list",
                r: "/record/list",
                d: "/discuss/lists",
                i: "/user/" + uindow._feInjection.currentUser.uid,
                m: "/chat",
                n: "/user/notification",
            }[name]
            if (tar) cmds.cd(tar)
            else cli_error`cc: unknown target "${name}"`
        },
        mod: (action/* !string*/, name/* string*/) => {
            /* for <action> "enable|disable|toggle", opearte the mod named <name>. */
            /* 当 <action> 为 "enable|disable|toggle"，对名为 <name> 的模块执行对应操作：启用|禁用|切换。 */
            const i = mod.find_i(name)
            switch (action) {
            case "enable":
            case "disable":
            case "toggle":
                if (i < 0) return cli_error`mod: unknown mod "${name}"`
                sto[name].on = {
                    enable: () => true, disable: () => false, toggle: now => ! now
                }[action](sto[name].on)
                break
            default:
                return cli_error`mod: unknown action "${action}"`
            }
        },
        dash: (action/* !string*/) => {
            /* for <action> "show|hide|toggle", opearte the exlg dashboard. */
            /* 当 <action> 为 "show|hide|toggle", 显示|隐藏|切换 exlg 管理面板。 */
            if (! [ "show", "hide", "toggle" ].includes(action))
                return cli_error`dash: unknown action "${action}"`
            $("#exlg-dash-window")[action]()
        },
        lang: (lang/* !string*/) => {
            /* for <lang> "en|zh" switch current cli language. */
            /* 当 <lang> 为 "en|zh"，切换当前语言。 */
            try {
                msto.lang = lang
                cli_lang = cli_langs.indexOf(lang)
            }
            catch {
                return cli_error`lang: unknown language ${lang}`
            }
        },
        uid: (uid/* !integer*/) => {
            /* jumps to homepage of user whose uid is <uid>. */
            /* 跳转至 uid 为 <uid> 的用户主页。 */
            location.href = `/user/${uid}`
        },
        un: (name/* !string*/) => {
            /* jumps to homepage of user whose username is like <name>. */
            /* 跳转至用户名与 <name> 类似的用户主页。 */
            $.get("/api/user/search?keyword=" + name, res => {
                if (! res.users[0])
                    cli_error`un: unknown user "${name}".`
                else
                    location.href = "/user/" + res.users[0].uid
            })
        }
    }
    for (const f of Object.values(cmds)) {
        [ , f.arg, f.help ] = f.toString().match(/^\((.*?)\) => {((?:\n +\/\*.+?\*\/)+)/)
        f.arg = f.arg.split(", ").map(a => {
            const [ , name, type ] = a.match(/([a-z_]+)\/\* (.+)\*\//)
            return {
                name, essential: type[0] === "!", type: type.replace(/^!/, "")
            }
        })
        f.help = f.help.trim().split("\n").map(s => s.match(/\/\* (.+) \*\//)[1])
    }
    const parse = cmd => {
        log(`Parsing command: "${cmd}"`)

        const tk = cmd.trim().replace(/^\//, "").split(" ")
        const n = tk.shift()
        if (! n) return
        const f = cmds[n]
        if (! f) return cli_error`exlg: unknown command "${n}"`
        let i = -1, a; for ([ i, a ] of tk.entries()) {
            const t = f.arg[i].type
            if (t === "number" || t === "integer") tk[i] = + a
            if (
                t === "char" && a.length === 1 ||
                t === "number" && ! isNaN(tk[i]) ||
                t === "integer" && ! isNaN(tk[i]) && ! (tk[i] % 1) ||
                t === "string"
            ) ;
            else return cli_error`${n}: illegal param "${a}", expected type ${t}.`
        }
        if (f.arg[i + 1]?.essential) return cli_error`${n}: lost essential param "${ f.arg[i + 1].name }"`
        f(...tk)
    }

    $cli_input.on("keydown", e => {
        switch (e.key) {
        case "Enter":
            if (cli_is_log) return cli_clean()
            const cmd = $cli_input.val()
            cli_history.push(cmd)
            cli_history_index = cli_history.length
            parse(cmd)
            if (! cli_is_log) return cli_clean()
            break
        case "/":
            if (cli_is_log) cli_clean()
            break
        case "Escape":
            $cli.hide()
            break
        case "ArrowUp":
        case "ArrowDown":
            const i = cli_history_index + { ArrowUp: -1, ArrowDown: +1 }[ e.key ]
            if (i < 0 || i >= cli_history.length) return
            cli_history_index = i
            $cli_input.val(cli_history[i])
            break
        }
    })

    $(uindow).on("keydown", e => {
        const $act = $(document.activeElement)
        if ($act.is("body")) {
            const rel = { ArrowLeft: "prev", ArrowRight: "next" }[ e.key ]
            if (rel) return $(`a[rel=${rel}]`)[0].click()

            if (e.shiftKey) {
                const y = { ArrowUp: 0, ArrowDown: 1e6 }[ e.key ]
                if (y !== undefined) uindow.scrollTo(0, y)
            }

            if (e.key === "/") {
                $cli.show()
                cli_clean().trigger("focus")
            }
        }
        else if ($act.is("[name=captcha]") && e.key === "Enter")
            $("#submitpost, #submit-reply")[0].click()
    })
}, `
    #exlg-cli {
        position: fixed;
        top: 0;
        z-index: 65536;
        display: none;
        width: 100%;
        height: 40px;
        background-color: white;
        box-shadow: 0 0 7px dodgerblue;
    }
    #exlg-cli-input {
        display: block;
        height: 100%;
        width: 100%;
        border: none;
        outline: none;
        font-family: "Fira Code", "consolas", "Courier New", monospace;
    }
    #exlg-cli-input.error {
        background-color: indianred;
    }
`)

// FIXME codeblock-ex

mod.reg_board("search-user", "查找用户名", null, ({ $board }) => {
    $board.html(`
        <h2>查找用户</h2>
        <div class="am-input-group am-input-group-primary am-input-group-sm">
            <input type="text" class="am-form-field" placeholder="例：kkksc03，可跳转站长主页" name="username" id="search-user-input">
        </div>
        <p>
            <button class="am-btn am-btn-danger am-btn-sm" id="search-user">跳转</button>
        </p>
    `)
    const func = () => {
        $search_user.prop("disabled", true)
        $.get("/api/user/search?keyword=" + $("[name=username]").val(), res => {
            if (! res.users[0]) {
                $search_user.prop("disabled", false)
                lg_alert("无法找到指定用户")
            }
            else location.href = "/user/" + res.users[0].uid
        })
    }
    const $search_user = $("#search-user").on("click", func)
    $("#search-user-input").keydown(e => { e.key === "Enter" && func() })
})

mod.reg_board("benben-ranklist", "犇犇龙王排行榜",null,({ $board })=>{
    GM_xmlhttpRequest({
        method: "GET",
        url: `https://bens.rotriw.com/ranklist?_contentOnly=1`,
        onload: function(res) {
            let s="<h3>犇犇排行榜</h3>"
            s+="<div>"
            $(JSON.parse(res.response)).each((index, obj) => {
                s+=`<div class="bb-rnklst-${index + 1}">
                    <span class="bb-rnklst-ind${(index < 9) ? (" bb-top-ten") : ("")}">${index + 1}.</span>
                    <a href="https://bens.rotriw.com/user/${obj[2]}">${obj[1]}</a>
                    <span style="float: right;">共 ${obj[0]} 条</span>
                </div>`
            })
            s+="</div><br>"
            $board.html(s)
        }
    })
},`
.bb-rnklst-1 > .bb-rnklst-ind {
    color: var(--lg-red);
    font-weight: 900;
}
.bb-rnklst-2 > .bb-rnklst-ind {
    color: var(--lg-orange);
    font-weight: 900;
}
.bb-rnklst-3 > .bb-rnklst-ind {
    color: var(--lg-yellow);
    font-weight: 900;
}
.bb-rnklst-ind.bb-top-ten {
    margin-right: 9px;
}
`)

mod.reg("discussion-save", "讨论保存", [ "@/discuss/\\d+(\\?page\\=\\d+)*$" ], {
    auto_save_discussion : { ty: "boolean", dft: false, strict: true, info: ["Discussion Auto Save", "自动保存讨论"] }
}, ({ msto }) => {
    const $btn = $(`<button class="am-btn am-btn-success am-btn-sm" name="save-discuss">保存讨论</button>`)
    $btn.on("click", () => {
        $btn.prop("disabled", true)
        $btn.text("保存中...")
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://luogulo.gq/save.php?url=${window.location.href}`,
            onload: (res) => {
                if (res.status === 200) {
                    if (res.response === "success") {
                        log("Discuss saved")
                        $btn.text("保存成功")
                        setTimeout(() => {
                            $btn.text("保存讨论")
                            $btn.removeAttr("disabled")
                        }, 1000)
                    }
                    else {
                        log(`Discuss unsuccessfully saved, return data: ${ res.response }`)
                        $btn.text("保存失败")
                        $btn.toggleClass("am-btn-success").toggleClass("am-btn-warning")
                        setTimeout(() => {
                            $btn.text("保存讨论")
                            $btn.removeAttr("disabled")
                            $btn.toggleClass("am-btn-success").toggleClass("am-btn-warning")
                        }, 1000)
                    }
                }
                else {
                    log(`Fail to save discuss: ${res}`)
                    $btn.toggleClass("am-btn-success").toggleClass("am-btn-danger")
                    setTimeout(() => {
                        $btn.text("保存讨论")
                        $btn.removeAttr("disabled")
                        $btn.toggleClass("am-btn-success").toggleClass("am-btn-danger")
                    }, 1000)
                }
            },
            onerror: (err) => {
                log(`Error:${err}`)
                $btn.removeAttr("disabled")
            }
        })
    })
        .css("margin-top", "5px")
    const $btn2 = $(`<a class="am-btn am-btn-warning am-btn-sm" name="save-discuss" href="https://luogulo.gq/show.php?url=${location.href}">查看备份</a>`).css("margin-top", "5px")
    $("section.lg-summary").find("p").append($(`<br>`)).append($btn).append($("<span>&nbsp;</span>")).append($btn2)
    if (msto.auto_save_discussion) $btn.click()
},`
.am-btn-warning {
    border-color: rgb(255, 193, 22);
    background-color: rgb(255, 193, 22);
    color: #fff;
}
`)

mod.reg_chore("sponsor-list", "获取标签列表", "1D", "@/.*", {
    tag_list: { ty: "string", priv: true }
}, ({ msto }) => {
    GM_xmlhttpRequest({
        method: "GET",
        url: `https://service-cmrlfv7t-1305163805.sh.apigw.tencentcs.com/release/get/0/0/`,
        onload: (res) => {
            msto["tag_list"] = decodeURIComponent(res.responseText)
        },
        onerror: (err) => {
            error(err)
        }
    })
})

mod.reg_hook_new("sponsor-tag", "标签显示", [ "@/", "@/paste", "@/discuss/.*", "@/problem/.*", "@/ranking.*" ], {
    tag_list: { ty: "string", priv: true }
}, ({ args }) => {
    // $("span.wrapper:has(a[target='_blank'][href]) > span:has(a[target='_blank'][href]):not(.hover):not(.exlg-sponsor-tag)").addClass("exlg-sponsor-tag") // Note: usernav的span大钩钩
    const tag_list = JSON.parse(sto["^sponsor-list"].tag_list)
    const add_badge = ($e) => {
        if (! $e || $e.hasClass("exlg-badge-username")) return
        // Note: 又 tm 重构啊啊啊啊啊啊啊啊啊啊啊 wdnmd
        if (! /\/user\/[1-9][0-9]{0,}/.test($e.attr("href"))) return
        $e.addClass("exlg-badge-username") // Note: 删掉这行会出刷犇犇的bug，一开始我以为每个元素被添加一次所以问题不大 但是事实证明我是傻逼
        const tag = tag_list[$e.attr("href").substring("/user/".length)]
        if (! tag) return
        const $badge = $(`<span class="exlg-badge">${ tag }</span>`).on("click", () => location.href = "https://www.luogu.com.cn/paste/asz40850")
        let $tar = $e
        if ($tar.next().length && $tar.next().hasClass("sb_amazeui")) $tar = $tar.next()
        if ($tar.next().length && $tar.next().hasClass("am-badge")) $tar = $tar.next()
        $tar.after($badge) // Note: 短多了，舒服
    }
    args.each((_, e) => add_badge($(e)))
}, (e) => {
    const $tmp = $(e.target).find("a[target='_blank'][href]")
    return {
        result: $tmp.length,
        args: $tmp
    } // Note: 我他妈不知道怎么回事我淦但就是要这么写 就 n m 离 谱
}, () => $("a[target='_blank'][href]"),`
.exlg-badge {
    border-radius: 50px;
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 4px;
    padding-bottom: 4px;
    transition: all .15s;
    display: inline-block;
    min-width: 10px;
    font-size: 1em;
    font-weight: 700;
    background-color: mediumturquoise;
    color: #fff;
    line-height: 1;
    vertical-align: baseline;
    white-space: nowrap;
    cursor: pointer;
    margin-left: 2px;
    margin-right: 2px;
}
`)

mod.reg("mainpage-discuss-limit", "主页讨论个数限制", [ "@/" ], {
    max_discuss : { ty: "number", dft: 12, min: 4, max: 16, info: [ "Max Discussions On Show", "主页讨论显示上限" ], strict: true }
}, ({ msto }) => {
    let $discuss = undefined
    if (location.href.includes("blog")) return // Note: 如果是博客就退出
    $(".lg-article").each((i, e, $e = $(e)) => {
        const title = e.childNodes[1]
        if (title && title.tagName.toLowerCase() === "h2" && title.innerText.includes("讨论"))
            $discuss = $e.children(".am-panel")
    })
    $discuss.each((i, e, $e = $(e)) => {
        if (i >= msto.max_discuss) $e.hide()
    })
})

mod.reg("benben-emoticon", "犇犇表情输入", [ "@/" ], {
    show: { ty: "boolean", dft: true }
}, () => {
    const emo = [
        { type: "emo", name: [ "kk" ], slug: "0" },
        { type: "emo", name: [ "jk" ], slug: "1" },
        { type: "emo", name: [ "se" ], slug: "2" },
        { type: "emo", name: [ "qq" ], slug: "3" },
        { type: "emo", name: [ "xyx" ], slug: "4" },
        { type: "emo", name: [ "xia" ], slug: "5" },
        { type: "emo", name: [ "cy" ], slug: "6" },
        { type: "emo", name: [ "ll" ], slug: "7" },
        { type: "emo", name: [ "xk" ], slug: "8" },
        { type: "emo", name: [ "qiao" ], slug: "9" },
        { type: "emo", name: [ "qiang" ], slug: "a" },
        { type: "emo", name: [ "ruo" ], slug: "b" },
        { type: "emo", name: [ "mg" ], slug: "c" },
        { type: "emo", name: [ "dx" ], slug: "d" },
        { type: "emo", name: [ "youl" ], slug: "e" },
        { type: "emo", name: [ "baojin" ], slug: "f" },
        { type: "emo", name: [ "shq" ], slug: "g" },
        { type: "emo", name: [ "lb" ], slug: "h" },
        { type: "emo", name: [ "lh" ], slug: "i" },
        { type: "emo", name: [ "qd" ], slug: "j" },
        { type: "emo", name: [ "fad" ], slug: "k" },
        { type: "emo", name: [ "dao" ], slug: "l" },
        { type: "emo", name: [ "cd" ], slug: "m" },
        { type: "emo", name: [ "kun" ], slug: "n" },
        { type: "emo", name: [ "px" ], slug: "o" },
        { type: "emo", name: [ "ts" ], slug: "p" },
        { type: "emo", name: [ "kl" ], slug: "q" },
        { type: "emo", name: [ "yiw" ], slug: "r" },
        { type: "emo", name: [ "dk" ], slug: "s" },
        { type: "txt", name: [ "hqlm" ], slug: "l0", name_display: "火前留名" },
        { type: "txt", name: [ "sqlm" ], slug: "l1", name_display: "山前留名" },
        { type: "txt", name: [ "xbt" ], slug: "g1", name_display: "屑标题" },
        { type: "txt", name: [ "iee", "wee" ], slug: "g2", name_display: "我谔谔" },
        { type: "txt", name: [ "kg" ], slug: "g3", name_display: "烤咕" },
        { type: "txt", name: [ "gl" ], slug: "g4", name_display: "盖楼" },
        { type: "txt", name: [ "qwq" ], slug: "g5", name_display: "QωQ" },
        { type: "txt", name: [ "wyy" ], slug: "g6", name_display: "无意义" },
        { type: "txt", name: [ "wgzs" ], slug: "g7", name_display: "违规紫衫" },
        { type: "txt", name: [ "tt" ], slug: "g8", name_display: "贴贴" },
        { type: "txt", name: [ "jbl" ], slug: "g9", name_display: "举报了" },
        { type: "txt", name: [ "%%%", "mmm" ], slug: "ga", name_display: "%%%" },
        { type: "txt", name: [ "ngrb" ], slug: "gb", name_display: "你谷日爆" },
        { type: "txt", name: [ "qpzc", "qp", "zc" ], slug: "gc", name_display: "前排资瓷" },
        { type: "txt", name: [ "cmzz" ], slug: "gd", name_display: "臭名昭著" },
        { type: "txt", name: [ "zyx" ], slug: "ge", name_display: "致远星" },
        { type: "txt", name: [ "zh" ], slug: "gf", name_display: "祝好" },
        { type: "txt", name: [ "sto" ], slug: "gg", name_display: "sto" },
        { type: "txt", name: [ "orz" ], slug: "gh", name_display: "orz" },
    ]
    const $txt = $("#feed-content"), emo_url = name => `//图.tk/${name}`, txt = $txt[0]
    $("#feed-content").before("<div id='emo-lst'></div>")
    emo.forEach(m => {
        $((m.type === "emo")?
            `<button class="exlg-emo-btn" exlg="exlg"><img src="${emo_url(m.slug)}" /></button>`
            :
            `<button class="exlg-emo-btn" exlg="exlg">${m.name_display}</button>`
        ).on("click", () => {
            const preval = txt.value
            const pselstart = txt.selectionStart
            const str1 = preval.slice(0, pselstart) + `![](${emo_url(m.slug)})`
            txt.value = (str1 + preval.slice(txt.selectionEnd))
            txt.focus()
            txt.setSelectionRange(str1.length, str1.length)
        }
        ).appendTo("#emo-lst")
    })
    $("#feed-content").before("<br>")
    $txt.on("input", e => {
        if (e.originalEvent.data === "/")
            mdp.content = mdp.content.replace(/\/(.{1,5})\//g, (_, emo_txt) =>
                `![](` + emo_url(emo.find(m => m.name.includes(emo_txt)).slug) + `)`
            )
    })
}, `
.exlg-emo-btn {
    position: relative;
    top: 0px;
    border: none;
    background-color: #eee;
    border-radius: .7em;
    margin: .1em;
    transition: all .4s;
    height: 2em;
}
.exlg-emo-btn:hover {
    background-color: #f3f3f3;
    top: -3px;
}
`)

mod.reg("user-css", "自定义样式表", ".*", {
    css: { ty: "string" }
}, ({ msto }) => GM_addStyle(msto.css)
)

$(() => {
    log("Exposing")

    Object.assign(uindow, {
        exlg: {
            mod,
            log, error,
            springboard, version_cmp,
            lg_alert, lg_content,
            TM_dat: {
                reload_dat: () => {
                    raw_dat = null
                    return load_dat(mod.data, {
                        map: s => {
                            s.root = ! s.rec
                            s.itmRoot = s.rec === 2
                        }
                    })
                },
                type_dat, proxy_dat, load_dat, save_dat, clear_dat, raw_dat
            }
        },
        GM: {
            GM_info, GM_addStyle, GM_setClipboard, GM_xmlhttpRequest,
            GM_getValue, GM_setValue, GM_deleteValue, GM_listValues
        },
        $$: $, xss, marked
    })

    const init_sto = chance => {
        try {
            sto = uindow.exlg.TM_dat.sto = uindow.exlg.TM_dat.reload_dat()
        }
        catch(err) {
            if (chance) {
                lg_alert("存储代理加载失败，清存重试中……")
                clear_dat()
                init_sto(chance - 1)
            }
            else {
                lg_alert("失败次数过多，自闭中。这里建议联系开发人员呢。")
                throw err
            }
        }
    }
    init_sto(1)

    log("Launching")
    mod.execute()
})
