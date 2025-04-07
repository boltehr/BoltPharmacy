import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Loader2, Search as SearchIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SearchProps = {
  className?: string;
  placeholder?: string;
};

export function Search({ className, placeholder = "Search medications by name..." }: SearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/medications/search", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const res = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },
    enabled: !!query.trim(),
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });

  const handleSearch = () => {
    if (query.trim()) {
      navigate(`/medications?search=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/medications?category=${encodeURIComponent(category)}`);
    setOpen(false);
  };

  return (
    <div className={className}>
      <div className="relative rounded-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-neutral-400" />
        </div>
        <Input
          type="text"
          className="block w-full pl-10 pr-12 py-3 border border-neutral-300 rounded-md focus:ring-primary focus:border-primary"
          placeholder={placeholder}
          onClick={() => setOpen(true)}
          readOnly
        />
      </div>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command className="rounded-lg border shadow-md">
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={setQuery}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuery("")}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandList>
            {isLoading && (
              <div className="py-6 text-center text-sm">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-neutral-400" />
              </div>
            )}
            {!query && categories && (
              <CommandGroup heading="Popular categories">
                <div className="flex flex-wrap gap-2 p-2">
                  {categories.map((category: any) => (
                    <Badge 
                      key={category.id} 
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleCategoryClick(category.name)}
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </CommandGroup>
            )}
            {query && !isLoading && (
              <>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Results">
                  {searchResults?.map((result: any) => (
                    <CommandItem
                      key={result.id}
                      onSelect={() => {
                        navigate(`/medications/${result.id}`);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        <div className="ml-2">
                          <p className="text-sm font-medium">{result.name}</p>
                          <p className="text-xs text-neutral-500">
                            {result.genericName} {result.brandName && `(${result.brandName})`}
                          </p>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div className="flex items-center justify-end p-2 border-t">
            <Button onClick={handleSearch} disabled={!query.trim()}>
              Search
            </Button>
          </div>
        </Command>
      </CommandDialog>
      
      {categories && (
        <div className="mt-2 flex flex-wrap">
          {categories.slice(0, 5).map((category: any) => (
            <Badge 
              key={category.id} 
              variant="secondary"
              className="mr-2 mb-2 cursor-pointer"
              onClick={() => handleCategoryClick(category.name)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
