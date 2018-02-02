JS_COMPILER ?= uglifyjs
SHOW_COMPILE = printf "\033[32mBuilding \033[1m%s\033[0m\n"
ALL_SRC=src/dgc-core.js src/dgc-donut.js src/dgc-linearea.js src/dgc-bar.js
TARGETS= $(foreach dir, src, $(patsubst $(dir)/%.js,  dist/%.min.js,$(filter-out $(dir)/dgc-core.js, $(wildcard $(dir)/*.js))))

all: dist/d3-graph-componants.min.js dist/d3-graph-componants.js $(TARGETS)
dist/d3-graph-componants.js: $(ALL_SRC)
	@$(SHOW_COMPILE) $@
	@cat $(ALL_SRC) > $@
dist/d3-graph-componants.min.js: $(ALL_SRC)
	@$(SHOW_COMPILE) $@
	@cat $^ | $(JS_COMPILER) > $@
dist/%.min.js: src/dgc-core.js src/%.js
	@$(SHOW_COMPILE) $@
	@cat $^ | $(JS_COMPILER) > $@

clean:
	@rm dist/*
.phony: all clean
