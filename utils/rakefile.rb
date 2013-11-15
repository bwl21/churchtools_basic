desc "help"
task :default do
	sh "rake -D"
end

desc "Generate API-Documentation"
task :doc do
  cmd="php -c zsupp_tools  apigen/apigen.php "
  cmd << " --source=../system"
  cmd << " -d=../apidoc"
  sh cmd
end

