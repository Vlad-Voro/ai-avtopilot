Write-Host "Отправка файлов в https://github.com/Vlad-Voro/ai-avtopilot.git..." -ForegroundColor Cyan
git -C "D:\AI\data\ai-avtopilot" push -u origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Все файлы успешно загружены на GitHub!" -ForegroundColor Green
} else {
    Write-Host "Не удалось отправить. Убедитесь, что репозиторий создан на https://github.com/new?name=ai-avtopilot" -ForegroundColor Red
}
