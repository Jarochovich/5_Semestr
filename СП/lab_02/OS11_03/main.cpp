#include "../OS11_HTAPI/pch.h"
#include "../OS11_HTAPI/HT.h"
#include <string>
#include <sstream>
#include <ctime>
#include <iostream>

using namespace std;

string intToString(int number)
{
	stringstream convert;
	convert << number;

	return convert.str();
}

int main(int argc, char* argv[])
{
	srand(static_cast<unsigned int>(time(nullptr)));

	try
	{
#ifdef _WIN64
		HMODULE hmdll = LoadLibrary(L"../x64/Debug/OS11_HTAPI.dll");
#else
		HMODULE hmdll = LoadLibrary(L"../Debug/OS11_HTAPI.dll");
#endif

		if (!hmdll)
			throw "-- LoadLibrary failed";
		cout << "-- LoadLibrary success" << endl;

		auto open = (ht::HtHandle * (*)(const wchar_t*, bool)) GetProcAddress(hmdll, "open");
		auto removeOne = (BOOL(*)(ht::HtHandle*, const ht::Element*)) GetProcAddress(hmdll, "removeOne");
		auto createInsertElement = (ht::Element * (*)(const void*, int, const void*, int)) GetProcAddress(hmdll, "createInsertElement");
		auto close = (BOOL(*)(const ht::HtHandle*)) GetProcAddress(hmdll, "close");

		ht::HtHandle* ht = open(L"HTspace.ht", true);
		if (ht)
			cout << "-- open: success" << endl;
		else
			throw "-- open: error";

		while (true) {
			HANDLE ownerEvent = OpenEvent(SYNCHRONIZE, FALSE, L"HTspace.ht_OWNER");
			if (!ownerEvent) {
				cout << "[ERROR] OS11_START is not running anymore. Exiting...\n";
				break;
			}
			CloseHandle(ownerEvent);

			int numberKey = rand() % 50;
			string key = intToString(numberKey);
			cout << key << endl;

			ht::Element* element = createInsertElement(key.c_str(), key.length() + 1, "0", 2);
			if (removeOne(ht, element))
				cout << "-- remove: success" << endl;
			else
				cout << "-- remove: error" << endl;

			delete element;

			Sleep(1000);
		}

		if (ht && close)
			close(ht);

	}
	catch (const char* msg)
	{
		cout << msg << endl;
	}
}