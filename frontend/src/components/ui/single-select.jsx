import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { X, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { forwardRef, useEffect } from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  return debouncedValue;
}
function transToGroupOption(options, groupBy) {
  if (options.length === 0) {
    return {};
  }
  if (!groupBy) {
    return {
      "": options
    };
  }
  const groupOption = {};
  options.forEach((option) => {
    const key = option[groupBy] || "";
    if (!groupOption[key]) {
      groupOption[key] = [];
    }
    groupOption[key].push(option);
  });
  return groupOption;
}
const CommandEmpty = forwardRef(({ className, ...props }, forwardedRef) => {
  const render = useCommandState((state) => state.filtered.count === 0);
  if (!render) return null;
  return <div
    ref={forwardedRef}
    className={cn("py-6 text-center text-sm", className)}
    cmdk-empty=""
    role="presentation"
    {...props}
  />;
});
CommandEmpty.displayName = "CommandEmpty";
const SingleSelector = React.forwardRef(
  ({
    value,
    onChange,
    placeholder,
    defaultOptions = [],
    options: arrayOptions,
    delay,
    onSearch,
    onSearchSync,
    loadingIndicator,
    emptyIndicator,
    disabled,
    groupBy,
    className,
    selectFirstItem = true,
    creatable = false,
    triggerSearchOnFocus = false,
    commandProps,
    inputProps
  }, ref) => {
    const inputRef = React.useRef(null);
    const [open, setOpen] = React.useState(false);
    const [onScrollbar, setOnScrollbar] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const dropdownRef = React.useRef(null);
    const [selected, setSelected] = React.useState(value);
    const [options, setOptions] = React.useState(
      transToGroupOption(defaultOptions, groupBy)
    );
    const [inputValue, setInputValue] = React.useState("");
    const [commandValue, setCommandValue] = React.useState("");
    const [showAllOptions, setShowAllOptions] = React.useState(true);
    const debouncedSearchTerm = useDebounce(inputValue, delay || 500);
    React.useImperativeHandle(
      ref,
      () => ({
        selectedValue: selected,
        input: inputRef.current,
        focus: () => inputRef?.current?.focus(),
        reset: () => setSelected(void 0)
      }),
      [selected]
    );
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && inputRef.current && !inputRef.current.contains(event.target)) {
        setOpen(false);
        inputRef.current.blur();
      }
    };
    const handleUnselect = React.useCallback(() => {
      setSelected(void 0);
      onChange?.(void 0);
      setInputValue("");
      if (arrayOptions) {
        setOptions(transToGroupOption(arrayOptions, groupBy));
      }
    }, [arrayOptions, groupBy, onChange]);
    useEffect(() => {
      if (open && arrayOptions && !inputValue) {
        const fullOptions = transToGroupOption([...arrayOptions], groupBy);
        setOptions(fullOptions);
      }
    }, [open, arrayOptions, groupBy, inputValue]);
    useEffect(() => {
      if (open) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchend", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchend", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchend", handleClickOutside);
      };
    }, [open]);
    useEffect(() => {
      if (value !== void 0) {
        setSelected(value);
      }
    }, [value]);
    useEffect(() => {
      if (!arrayOptions || onSearch) {
        return;
      }
      const newOption = transToGroupOption(arrayOptions || [], groupBy);
      if (JSON.stringify(newOption) !== JSON.stringify(options)) {
        setOptions(newOption);
      }
    }, [defaultOptions, arrayOptions, groupBy, onSearch, options]);
    useEffect(() => {
      const doSearchSync = () => {
        const res = onSearchSync?.(debouncedSearchTerm);
        setOptions(transToGroupOption(res || [], groupBy));
      };
      const exec = async () => {
        if (!onSearchSync || !open) return;
        if (triggerSearchOnFocus) {
          doSearchSync();
        }
        if (debouncedSearchTerm) {
          doSearchSync();
        }
      };
      void exec();
    }, [
      debouncedSearchTerm,
      groupBy,
      onSearchSync,
      open,
      triggerSearchOnFocus
    ]);
    useEffect(() => {
      const doSearch = async () => {
        setIsLoading(true);
        const res = await onSearch?.(debouncedSearchTerm);
        setOptions(transToGroupOption(res || [], groupBy));
        setIsLoading(false);
      };
      const exec = async () => {
        if (!onSearch || !open) return;
        if (triggerSearchOnFocus) {
          await doSearch();
        }
        if (debouncedSearchTerm) {
          await doSearch();
        }
      };
      void exec();
    }, [debouncedSearchTerm, groupBy, onSearch, open, triggerSearchOnFocus]);
    const CreatableItem = () => {
      if (!creatable) return void 0;
      let exists = false;
      Object.values(options).forEach((optGroup) => {
        if (optGroup.some(
          (opt) => opt.value === inputValue || opt.label === inputValue
        )) {
          exists = true;
        }
      });
      if (exists || selected && (selected.value === inputValue || selected.label === inputValue)) {
        return void 0;
      }
      const Item = <CommandItem
        value={inputValue}
        className="cursor-pointer"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onSelect={(value2) => {
          const newOption = { value: value2, label: value2 };
          setSelected(newOption);
          onChange?.(newOption);
          setInputValue("");
          setOpen(false);
        }}
      >
          {`Create "${inputValue}"`}
        </CommandItem>;
      if (!onSearch && inputValue.length > 0) {
        return Item;
      }
      if (onSearch && debouncedSearchTerm.length > 0 && !isLoading) {
        return Item;
      }
      return void 0;
    };
    const EmptyItem = React.useCallback(() => {
      if (!emptyIndicator) return void 0;
      if (onSearch && !creatable && Object.keys(options).length === 0) {
        return <CommandItem value="-" disabled>
            {emptyIndicator}
          </CommandItem>;
      }
      return <CommandEmpty>{emptyIndicator}</CommandEmpty>;
    }, [creatable, emptyIndicator, onSearch, options]);
    const commandFilter = React.useCallback(() => {
      if (commandProps?.filter) {
        return commandProps.filter;
      }
      if (creatable) {
        return (value2, search) => {
          return value2.toLowerCase().includes(search.toLowerCase()) ? 1 : -1;
        };
      }
      return void 0;
    }, [creatable, commandProps?.filter]);
    return <Command
      ref={dropdownRef}
      {...commandProps}
      value={commandValue}
      className={cn(
        "h-auto overflow-visible bg-transparent",
        commandProps?.className
      )}
      shouldFilter={false}
      filter={commandFilter()}
    >
        <div
      className={cn(
        "flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
      onClick={() => {
        if (disabled) return;
        setOpen(true);
        setShowAllOptions(true);
        setInputValue("");
        setCommandValue(Math.random().toString());
        if (arrayOptions) {
          setOptions(transToGroupOption(arrayOptions, groupBy));
        }
        inputRef?.current?.focus();
        if (triggerSearchOnFocus) {
          if (onSearch) {
            onSearch("");
          } else if (onSearchSync) {
            const res = onSearchSync("");
            setOptions(transToGroupOption(res || [], groupBy));
          }
        }
      }}
    >
          {selected ? <div className="flex flex-1 items-center">
              {selected.label}
              {!disabled && <button
      type="button"
      className="ml-2"
      onClick={(e) => {
        e.stopPropagation();
        handleUnselect();
      }}
    >
                  <X className="h-4 w-4" />
                </button>}
            </div> : <CommandPrimitive.Input
      {...inputProps}
      ref={inputRef}
      value={inputValue}
      disabled={disabled}
      onValueChange={(value2) => {
        setInputValue(value2);
        setShowAllOptions(value2.length === 0);
        inputProps?.onValueChange?.(value2);
      }}
      onBlur={(event) => {
        if (!onScrollbar) {
          setOpen(false);
        }
        inputProps?.onBlur?.(event);
      }}
      onFocus={(event) => {
        setOpen(true);
        if (arrayOptions) {
          setOptions(transToGroupOption(arrayOptions, groupBy));
        }
        if (triggerSearchOnFocus) {
          if (onSearch) {
            onSearch("");
          } else if (onSearchSync) {
            const res = onSearchSync("");
            setOptions(transToGroupOption(res || [], groupBy));
          }
        }
        inputProps?.onFocus?.(event);
      }}
      placeholder={placeholder}
      className={cn(
        "flex-1 bg-transparent outline-none placeholder:text-muted-foreground",
        inputProps?.className
      )}
    />}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </div>
        <div className="relative">
          {open && <CommandList
      className="absolute top-1 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in"
      onMouseLeave={() => {
        setOnScrollbar(false);
      }}
      onMouseEnter={() => {
        setOnScrollbar(true);
      }}
      onMouseUp={() => {
        inputRef?.current?.focus();
      }}
    >
              {isLoading ? <>{loadingIndicator}</> : <>
                  {EmptyItem()}
                  {CreatableItem()}
                  {!selectFirstItem && <CommandItem value="-" className="hidden" />}
                  {Object.entries(options).map(([key, dropdowns]) => <CommandGroup
      key={key}
      heading={key}
      className="h-full overflow-auto"
    >
                      <>
                        {dropdowns.filter(
      (option) => showAllOptions || option.label.toLowerCase().includes(inputValue.toLowerCase())
    ).map((option) => {
      return <CommandItem
        key={option.value}
        value={option.label}
        disabled={option.disable}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onSelect={() => {
          setInputValue("");
          setSelected(option);
          onChange?.(option);
          setOpen(false);
        }}
        className={cn(
          "cursor-pointer",
          option.disable && "cursor-default text-muted-foreground"
        )}
      >
                              {option.label}
                            </CommandItem>;
    })}
                      </>
                    </CommandGroup>)}
                </>}
            </CommandList>}
        </div>
      </Command>;
  }
);
SingleSelector.displayName = "SingleSelector";
export {
  SingleSelector,
  useDebounce
};
