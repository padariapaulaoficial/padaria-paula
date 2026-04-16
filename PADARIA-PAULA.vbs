' PADARIA PAULA - Iniciador Silencioso
' Este arquivo abre o sistema sem mostrar a janela preta

Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\PADARIA-PAULA-INSTALAR.bat" & Chr(34), 0
Set WshShell = Nothing
