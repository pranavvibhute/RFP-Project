with open('src/components/chat/RFPChatModal.tsx', 'r') as f:
    content = f.read()

# Find the exact section to replace
old_start = content.find('                    ) : (\n                      filteredRfps.map((rfp) => (')
if old_start == -1:
    print('Not found')
    exit(1)

# Find the end of the map section - look for the closing of the map and ternary
old_end = content.find('                      ))}', old_start)
if old_end == -1:
    print('End not found')
    exit(1)

old_end += len('                      ))}')

old_section = content[old_start:old_end]
print('Found section, length:', len(old_section))
print('First 200 chars:', repr(old_section[:200]))

new_section = '''                    ) : (
                      <>
                        {filteredRfps.map((rfp) => (
                          <button
                            key={rfp.id}
                            onClick={() => {
                              setSelectedRfpId(rfp.id);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${\n                              selectedRfpId === rfp.id\n                                ? "bg-[#c8102e] text-white"\n                                : "text-slate-700 hover:bg-slate-50"\n                            }`}\n                          >\n                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${\n                              selectedRfpId === rfp.id ? "bg-white/20" : "bg-slate-100"\n                            }`}>\n                              <FileText className={`w-4 h-4 ${\n                                selectedRfpId === rfp.id ? "text-white" : "text-[#c8102e]"\n                              }`} />\n                            </div>\n                            <div className="flex-1 min-w-0 flex flex-col">\n                              <span className={`text-sm font-medium truncate ${\n                                selectedRfpId === rfp.id ? "text-white" : "text-slate-800"\n                              }`}>\n                                {rfp.title}\n                              </span>\n                              <span className={`text-[11px] truncate ${\n                                selectedRfpId === rfp.id ? "text-white/80" : "text-slate-500"\n                              }`}>\n                                {rfp.customer_name}\n                              </span>\n                            </div>\n                            {selectedRfpId === rfp.id && (\n                              <Check className="w-4 h-4 text-white shrink-0" />\n                            )}\n                          </button>
                        ))}
                      </>
                    )'''

content = content[:old_start] + new_section + content[old_end:]

with open('src/components/chat/RFPChatModal.tsx', 'w') as f:
    f.write(content)

print('Fixed!')