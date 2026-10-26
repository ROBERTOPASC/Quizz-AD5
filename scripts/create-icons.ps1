# Original code-drawn app icons. Does not modify the repository's existing image.
Add-Type -AssemblyName System.Drawing
$iconRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\public'))
foreach ($size in @(192, 512)) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#183e48'))
  $cream = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#edf3ef'))
  $gold = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#e7b466'))
  $scale = $size / 512.0
  $graphics.FillEllipse($gold, [single](206*$scale), [single](85*$scale), [single](100*$scale), [single](100*$scale))
  $ink = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#183e48'), [single](12*$scale))
  $graphics.DrawLine($ink, [single](230*$scale), [single](135*$scale), [single](282*$scale), [single](135*$scale))
  $graphics.DrawLine($ink, [single](256*$scale), [single](109*$scale), [single](256*$scale), [single](161*$scale))
  $font = New-Object System.Drawing.Font('Segoe UI', [single](94*$scale), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString('EPSO', $font, $cream, [single]($size/2), [single](217*$scale), $format)
  $graphics.FillRectangle($gold, [single](136*$scale), [single](366*$scale), [single](240*$scale), [single](7*$scale))
  $bitmap.Save((Join-Path $iconRoot "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $format.Dispose(); $font.Dispose(); $ink.Dispose(); $cream.Dispose(); $gold.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}
