#include "../OS11_HTAPI/pch.h"
#include "../OS11_HTAPI/HT.h"
#include <string>
#include <sstream>
#include <ctime>
#include <iostream>
#include <windows.h>

using namespace std;

string intToString(int number)
{
	stringstream convert;
	convert << number;
	return convert.str();
}

int charToInt(char* str)
{
	stringstream convert;
	convert << str;
	int num;
	convert >> num;
	return num;
}

string incrementPayload(char* str)
{
	int oldNumberPayload = charToInt(str);
	int newNumberPayload = oldNumberPayload + 1;
	string newPayload = intToString(newNumberPayload);
	return newPayload;
}

int main(int argc, char* argv[])
{
	srand(static_cast<unsigned int>(time(nullptr)));

	HMODULE hmdll = nullptr;

	try
	{
#ifdef _WIN64
		hmdll = LoadLibrary(L"../x64/Debug/OS11_HTAPI.dll");
#else
		hmdll = LoadLibrary(L"../Debug/OS11_HTAPI.dll");
#endif

		if (!hmdll)
			throw "-- LoadLibrary failed";
		cout << "-- LoadLibrary success" << endl;

		auto open = (ht::HtHandle * (*)(const wchar_t*, bool)) GetProcAddress(hmdll, "open");
		auto get = (ht::Element * (*)(ht::HtHandle*, const ht::Element*)) GetProcAddress(hmdll, "get");
		auto createInsertElement = (ht::Element * (*)(const void*, int, const void*, int)) GetProcAddress(hmdll, "createInsertElement");
		auto update = (BOOL(*)(ht::HtHandle*, const ht::Element*, const void*, int)) GetProcAddress(hmdll, "update");
		auto close = (BOOL(*)(const ht::HtHandle*)) GetProcAddress(hmdll, "close");

		if (!open || !get || !update || !close || !createInsertElement)
			throw "-- GetProcAddress failed";

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

			ht::Element* getElement = createInsertElement(key.c_str(), key.length() + 1, "0", 2);

			ht::Element* element = get(ht, getElement);
			if (element)
			{
				cout << "-- get: success" << endl;

				if (element->payload && element->payloadLength > 0) {
					string newPayload = incrementPayload((char*)element->payload);

					if (update(ht, element, newPayload.c_str(), newPayload.length() + 1))
						cout << "-- update: success" << endl;
					else
						cout << "-- update: error" << endl;
				}
				else {
					cout << "-- update: error" << endl;
				}
			}
			else
			{
				cout << "-- get: error" << endl;
			}

			Sleep(1000);
		}

		if (ht && close)
			close(ht);

	}
	catch (const char* msg)
	{
		cout << msg << endl;
	}

	if (hmdll)
		FreeLibrary(hmdll);

	return 0;
}