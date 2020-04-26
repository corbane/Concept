
.PHONY: demo less

js:
	tsc -p .
	rollup -c

less:
	lessc --source-map ./Ui/style.less ./Demo/css/ui.css

install:
	yarn install --prod --ignore-optional

uninstall:
	rm -drf node_modules

clean:
	rm -drf .out
