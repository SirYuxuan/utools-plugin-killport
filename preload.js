const { exec } = require("child_process");
const isWindows = process.platform == "win32";
const cmd = isWindows ? "tasklist" : "ps aux";

window.exports = {
    "kill": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list",  // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {

                // 如果进入插件就要显示列表数据
                callbackSetList([
                    {
                        title: '端口号',
                        description: '请输入要查询的端口号',
                        icon:'' // 图标(可选)
                    }
                ])
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                let cmd = `netstat -aon|findstr "${searchWord}"`
                let result = []
                exec(cmd, (err, stdout, stderr) => {
                    if (err) {
                        return console.log(err);
                    }

                    const list = stdout
                        .split("\n")
                        .filter(line => !!line.trim())
                        .map(line => line.trim().split(/\s+/))
                        .map(p => {
                            let ip = p[1]
                            let status = p[3]
                            let pid = p[4]

                            if(status === 'LISTENING'){
                                if(ip.split(':')[1] === searchWord){
                                    let pids = []
                                    exec(`tasklist|findstr "${pid}"`, (err, stdout, stderr) => {
                                        stdout
                                            .split("\n")
                                            .filter(line => !!line.trim())
                                            .map(line => line.trim().split(/\s+/))
                                            .map(p => {
                                                if(pids.indexOf(pid) === -1){
                                                    pids.push(pid)
                                                    result.push({
                                                        title: '进程名: ' + p[0] + ", PID: "+ pid,
                                                        description: '点击关闭进程',
                                                        icon:'', // 图标
                                                        pid:pid
                                                    })
                                                }
                                            });
                                        callbackSetList(result)
                                    })
                                }
                            }
                        });

                });

            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {

                let pid = itemData.pid
                exec(`taskkill /T /F /PID ${pid}`,(err, stdout, stderr) => {
                    window.utools.hideMainWindow()
                    window.utools.outPlugin()
                    window.utools.removeSubInput()
                    window.utools.showNotification('指定程序已结束')
                })
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    }
}